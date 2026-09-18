import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nombreCompleto } from "@/lib/terceros";
import type { Cuenta, TipoMovimiento } from "@/lib/types";
import PagarConjuntoForm from "./pagar-conjunto-form";

export default async function PagarConjuntoPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; volver?: string }>;
}) {
  const { ids: idsParam, volver } = await searchParams;
  const ids = (idsParam || "").split(",").filter(Boolean);
  const redirectTo = volver && volver.startsWith("/") ? volver : "/cuentas-por-pagar";

  if (ids.length < 2) notFound();

  const supabase = await createClient();
  const { data: movimientos } = await supabase
    .from("movimientos_financieros")
    .select("*, tercero:terceros(nombre,apellido,tipo,sueldo)")
    .in("id", ids);

  if (!movimientos || movimientos.length !== ids.length) notFound();

  const tipo = movimientos[0].tipo as "ingreso" | "egreso";
  const yaNoValido = movimientos.some((m) => m.estado !== "pendiente");
  // Solo se ofrece IVA si TODOS los movimientos combinados son de Personal
  // por Servicios prestados — mezclar con proveedores/afiliados no debería
  // recargar 15% a algo que no corresponde.
  const esServiciosPrestados = movimientos.every((m) => m.tercero?.tipo === "empleado" && m.tercero?.sueldo != null);
  // La retención en la fuente admite Servicios prestados y Proveedores —
  // igual que el pago individual, no exige que todos sean del mismo tipo
  // entre sí, solo que cada uno califique para alguno de los dos.
  const permiteRetencion = movimientos.every(
    (m) => (m.tercero?.tipo === "empleado" && m.tercero?.sueldo != null) || m.tercero?.tipo === "proveedor"
  );

  const [{ data: cuentas }, { data: tiposMovimiento }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("tipos_movimiento").select("*").eq("direccion", tipo).eq("activo", true).order("orden"),
  ]);

  const conceptoCombinado = movimientos.map((m) => m.concepto || "Sin concepto").join(" + ");
  const valorTotal = movimientos.reduce((s, m) => s + Number(m.monto || 0), 0);
  const nombres = [...new Set(movimientos.map((m) => (m.tercero ? nombreCompleto(m.tercero) : null)).filter(Boolean))];

  return (
    <div>
      <Link href={redirectTo} className="btn-ghost btn-sm">
        ← Volver
      </Link>

      {yaNoValido ? (
        <p className="mt-4 text-[13.5px] text-muted">
          Alguno de los movimientos seleccionados ya no está pendiente (puede que alguien más ya lo haya pagado o
          anulado). Vuelve a la lista y selecciona de nuevo.
        </p>
      ) : (
        <div className="max-w-[480px] mt-3.5">
          <PagarConjuntoForm
            ids={ids}
            conceptoCombinado={conceptoCombinado}
            valorTotal={valorTotal}
            cantidad={movimientos.length}
            nombres={nombres as string[]}
            tiposMovimiento={(tiposMovimiento ?? []) as TipoMovimiento[]}
            cuentas={(cuentas ?? []) as Cuenta[]}
            esServiciosPrestados={esServiciosPrestados}
            permiteRetencion={permiteRetencion}
            redirectTo={redirectTo}
          />
        </div>
      )}
    </div>
  );
}
