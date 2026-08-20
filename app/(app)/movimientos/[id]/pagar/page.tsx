import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nombreCompleto } from "@/lib/terceros";
import type { Cuenta, TipoMovimiento } from "@/lib/types";
import FormularioMovimiento from "@/components/formulario-movimiento";

export default async function PagarMovimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ volver?: string }>;
}) {
  const { id } = await params;
  const { volver } = await searchParams;
  const redirectTo = volver && volver.startsWith("/") ? volver : "/cuentas-por-pagar";
  const supabase = await createClient();

  const [{ data: movimiento }, { data: cuentas }] = await Promise.all([
    supabase.from("movimientos_financieros").select("*, tercero:terceros(nombre,apellido)").eq("id", id).single(),
    supabase.from("cuentas").select("*").order("empresa"),
  ]);

  if (!movimiento) notFound();
  if (movimiento.estado !== "pendiente") {
    return (
      <div>
        <Link href={redirectTo} className="btn-ghost btn-sm">
          ← Volver
        </Link>
        <p className="mt-4 text-[13.5px] text-muted">Este movimiento ya no está pendiente.</p>
      </div>
    );
  }

  const { data: tiposMovimiento } = await supabase
    .from("tipos_movimiento")
    .select("*")
    .eq("direccion", movimiento.tipo)
    .eq("activo", true)
    .order("orden");

  return (
    <div>
      <Link href={redirectTo} className="btn-ghost btn-sm">
        ← Volver
      </Link>
      <div className="max-w-[480px] mt-3.5">
        <FormularioMovimiento
          modo="confirmar"
          tipo={movimiento.tipo}
          tiposMovimiento={(tiposMovimiento ?? []) as TipoMovimiento[]}
          cuentas={(cuentas ?? []) as Cuenta[]}
          movimiento={{ id: movimiento.id, monto: movimiento.monto, fecha: movimiento.fecha, concepto: movimiento.concepto }}
          terceroNombre={movimiento.tercero ? nombreCompleto(movimiento.tercero) : undefined}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
