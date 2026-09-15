import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nombreCompleto } from "@/lib/terceros";
import type { Cuenta, TipoMovimiento } from "@/lib/types";
import EditarDetalleForm from "./editar-detalle-form";

export default async function EditarMovimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ volver?: string }>;
}) {
  const { id } = await params;
  const { volver } = await searchParams;
  const redirectTo = volver && volver.startsWith("/") ? volver : "/movimientos";
  const supabase = await createClient();

  const { data: movimiento } = await supabase
    .from("movimientos_financieros")
    .select("*, cuenta:cuentas(*), tercero:terceros(nombre,apellido), tipo_movimiento:tipos_movimiento(*)")
    .eq("id", id)
    .single();

  if (!movimiento) notFound();

  const m = movimiento as typeof movimiento & {
    cuenta: Cuenta | null;
    tercero: { nombre: string; apellido: string | null } | null;
    tipo_movimiento: TipoMovimiento | null;
  };

  return (
    <div>
      <Link href={redirectTo} className="btn-ghost btn-sm">
        ← Volver
      </Link>

      {m.estado !== "confirmado" ? (
        <p className="mt-4 text-[13.5px] text-muted">
          Solo se pueden editar estos datos en movimientos ya confirmados. Este movimiento está{" "}
          {m.estado === "pendiente" ? "pendiente — usa Registrar pago para completarlo." : "anulado."}
        </p>
      ) : (
        <div className="max-w-[480px] mt-3.5">
          <EditarDetalleForm
            movimiento={{
              id: m.id,
              fecha: m.fecha,
              monto: m.monto,
              concepto: m.concepto,
              observaciones: m.observaciones,
              referencia: (m.referencia || {}) as Record<string, string>,
            }}
            cuenta={m.cuenta}
            quien={m.tipo === "ingreso" ? m.pagador : m.tercero ? nombreCompleto(m.tercero) : m.beneficiario}
            camposExtra={m.tipo_movimiento?.campos_extra ?? []}
            redirectTo={redirectTo}
          />
        </div>
      )}
    </div>
  );
}
