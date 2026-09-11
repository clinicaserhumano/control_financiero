import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { movimientosConSaldo, money, fmtDate, totalPorTipoEstado, numerosEgresoPorCuenta } from "@/lib/calculos";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConNombres = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null } | null;
};

export default async function CuentaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { id } = await params;
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  const [{ data: cuenta }, { data: movimientos }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("id", id).single(),
    supabase
      .from("movimientos_financieros")
      .select("*, tipo_movimiento:tipos_movimiento(nombre), tercero:terceros(nombre,apellido)")
      .eq("cuenta_id", id),
  ]);

  if (!cuenta) notFound();

  const lista = (movimientos ?? []) as unknown as MovConNombres[];
  const conSaldo = movimientosConSaldo(lista) as (MovConNombres & { saldoAcumulado: number })[];
  const saldoActual = conSaldo.length ? conSaldo[conSaldo.length - 1].saldoAcumulado : 0;
  const totalIngresos = totalPorTipoEstado(lista, "ingreso", "confirmado");
  const totalEgresos = totalPorTipoEstado(lista, "egreso", "confirmado");

  const filasFiltradas = conSaldo.filter(
    (m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta)
  );
  const numerosEgreso = numerosEgresoPorCuenta(lista.filter((m) => m.tipo === "egreso"));

  return (
    <div>
      <Link href="/cuentas" className="btn-ghost btn-sm">
        ← Volver a cuentas
      </Link>

      <div className="card mt-3.5">
        <div className="card-h">
          <h2>{cuenta.empresa}</h2>
          <span className="ml-auto text-[11px] text-muted font-semibold">
            {cuenta.banco} · {cuenta.tipo} {cuenta.numero}
          </span>
        </div>
        <div className="card-b">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
            <div className="stat">
              <div className="lbl">Ingresos confirmados</div>
              <div className="val text-primary-dark">{money(totalIngresos)}</div>
            </div>
            <div className="stat">
              <div className="lbl">Egresos confirmados</div>
              <div className="val">{money(totalEgresos)}</div>
            </div>
            <div className="stat">
              <div className="lbl">Movimientos confirmados</div>
              <div className="val">{conSaldo.length}</div>
            </div>
            <div className="stat">
              <div className="lbl">Saldo disponible</div>
              <div className={"val " + (saldoActual < 0 ? "text-danger" : "")}>{money(saldoActual)}</div>
            </div>
          </div>

          <form className="flex gap-3 flex-wrap items-end mb-3.5" method="get">
            <div className="field mb-0">
              <label className="flabel" htmlFor="desde">
                Desde
              </label>
              <input id="desde" name="desde" type="date" defaultValue={desde || ""} className="finput" />
            </div>
            <div className="field mb-0">
              <label className="flabel" htmlFor="hasta">
                Hasta
              </label>
              <input id="hasta" name="hasta" type="date" defaultValue={hasta || ""} className="finput" />
            </div>
            <button type="submit" className="btn-ghost btn-sm">
              Filtrar
            </button>
            {(desde || hasta) && (
              <Link href={`/cuentas/${id}`} className="btn-ghost btn-sm">
                Quitar fechas
              </Link>
            )}
            <Link href={`/imprimir/cuentas/${id}?desde=${desde || ""}&hasta=${hasta || ""}`} className="btn-navy btn-sm ml-auto">
              🖨️ Imprimir estado de cuenta
            </Link>
          </form>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Movimiento</th>
                  <th>Detalle</th>
                  <th>Cheque / Ref.</th>
                  <th className="td-num">Ingreso</th>
                  <th className="td-num">Egreso</th>
                  <th className="td-num">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-title">Sin movimientos</div>
                        {desde || hasta
                          ? "No hay movimientos confirmados en el rango de fechas."
                          : "Esta cuenta todavía no tiene movimientos confirmados."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((m) => (
                    <tr key={m.id}>
                      <td className="text-[11px] text-muted">{m.tipo === "egreso" ? numerosEgreso.get(m.id) ?? "—" : ""}</td>
                      <td>{fmtDate(m.fecha)}</td>
                      <td>{m.tipo_movimiento?.nombre || (m.tipo === "ingreso" ? "Ingreso" : "Egreso")}</td>
                      <td className="text-[11px] text-muted">
                        {[m.tercero ? `${m.tercero.nombre} ${m.tercero.apellido || ""}`.trim() : null, m.concepto]
                          .filter(Boolean)
                          .join(" · ")}
                      </td>
                      <td className="text-[11px] text-muted">
                        {Object.values(m.referencia || {}).filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="td-num text-primary-dark">{m.tipo === "ingreso" ? money(m.monto) : ""}</td>
                      <td className="td-num">{m.tipo === "egreso" ? money(m.monto) : ""}</td>
                      <td className={"td-num font-bold " + (m.saldoAcumulado < 0 ? "text-danger" : "text-ink")}>
                        {money(m.saldoAcumulado)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
