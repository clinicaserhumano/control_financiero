import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/calculos";
import type { Cuenta } from "@/lib/types";
import TablaPendientes from "./tabla-pendientes";

export default async function CuentasPorPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("movimientos_financieros")
    .select("id,fecha,concepto,monto,tercero:terceros(nombre,apellido)")
    .eq("tipo", "egreso")
    .eq("estado", "pendiente");
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  query = query.order("fecha", { ascending: true });

  const [{ data: pendientes }, { data: cuentas }] = await Promise.all([
    query,
    supabase.from("cuentas").select("*").order("empresa"),
  ]);

  const lista = pendientes ?? [];
  const total = lista.reduce((s, p) => s + Number(p.monto || 0), 0);

  return (
    <div>
      <p className="text-[12.5px] text-muted -mt-1.5 mb-[18px]">
        Todo egreso en estado &quot;pendiente&quot; aparece aquí automáticamente — nómina, proveedores y servicios
        comparten la misma tabla, no hay que registrarlos dos veces.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-5">
        <div className="stat">
          <div className="lbl">Registros pendientes</div>
          <div className="val">{lista.length}</div>
        </div>
        <div className="stat">
          <div className="lbl">Total pendiente</div>
          <div className="val text-primary-dark">{money(total)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Cuentas por Pagar</h2>
          <span className="ml-auto text-[11px] text-muted font-semibold">{lista.length} registro(s)</span>
        </div>
        <div className="p-0">
          <form method="get" className="flex gap-3 flex-wrap items-end px-4 pt-3.5 pb-3.5">
            <div className="field mb-0">
              <label className="flabel">Ingresadas desde</label>
              <input type="date" name="desde" defaultValue={desde || ""} className="finput" />
            </div>
            <div className="field mb-0">
              <label className="flabel">Hasta</label>
              <input type="date" name="hasta" defaultValue={hasta || ""} className="finput" />
            </div>
            <button type="submit" className="btn-ghost btn-sm">
              Filtrar
            </button>
            {(desde || hasta) && (
              <Link href="/cuentas-por-pagar" className="btn-ghost btn-sm">
                Quitar fechas
              </Link>
            )}
            <Link
              href={`/imprimir/cuentas-por-pagar${desde || hasta ? `?desde=${desde || ""}&hasta=${hasta || ""}` : ""}`}
              className="btn-navy btn-sm ml-auto"
            >
              ↦ Imprimir
            </Link>
          </form>

          <TablaPendientes pendientes={lista} cuentas={(cuentas ?? []) as Cuenta[]} />
        </div>
      </div>
    </div>
  );
}
