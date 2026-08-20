import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { movimientosConSaldo, money, fmtDate, todayISO } from "@/lib/calculos";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConNombres = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null } | null;
};

export default async function ImprimirCuentaPage({
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
  const filas = conSaldo.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta));
  const ingP = filas.reduce((s, m) => s + (m.tipo === "ingreso" ? Number(m.monto) : 0), 0);
  const egP = filas.reduce((s, m) => s + (m.tipo === "egreso" ? Number(m.monto) : 0), 0);

  let periodo = "Todas las fechas";
  if (desde && hasta) periodo = `${fmtDate(desde)} al ${fmtDate(hasta)}`;
  else if (desde) periodo = `Desde ${fmtDate(desde)}`;
  else if (hasta) periodo = `Hasta ${fmtDate(hasta)}`;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={`/cuentas/${id}`} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Estado de Cuenta Bancaria</div>
            <div className="org">
              {cuenta.empresa} · RUC {cuenta.ruc}
            </div>
            <div className="meta">
              {cuenta.banco} — {cuenta.tipo} {cuenta.numero}
            </div>
            <div className="badge">
              Período: {periodo} · {filas.length} movimiento(s)
            </div>
          </div>
        </div>
        <div className="sum">
          <div>
            Ingresos del período
            <b>{money(ingP)}</b>
          </div>
          <div>
            Egresos del período
            <b>{money(egP)}</b>
          </div>
          <div>
            Saldo disponible actual
            <b>{money(saldoActual)}</b>
          </div>
        </div>
        <table className="reporte">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Movimiento</th>
              <th>Detalle</th>
              <th style={{ textAlign: "right" }}>Ingreso</th>
              <th style={{ textAlign: "right" }}>Egreso</th>
              <th style={{ textAlign: "right" }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((m) => (
              <tr key={m.id}>
                <td>{fmtDate(m.fecha)}</td>
                <td>{m.tipo_movimiento?.nombre || (m.tipo === "ingreso" ? "Ingreso" : "Egreso")}</td>
                <td>
                  {[m.tercero ? `${m.tercero.nombre} ${m.tercero.apellido || ""}`.trim() : null, m.concepto]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="rt">{m.tipo === "ingreso" ? money(m.monto) : ""}</td>
                <td className="rt">{m.tipo === "egreso" ? money(m.monto) : ""}</td>
                <td className="rt">{money(m.saldoAcumulado)}</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={3} style={{ textAlign: "right" }}>
                TOTALES DEL PERÍODO
              </td>
              <td className="rt">{money(ingP)}</td>
              <td className="rt">{money(egP)}</td>
              <td className="rt">{money(saldoActual)}</td>
            </tr>
          </tbody>
        </table>
        <div className="foot">
          <span>Generado el {fmtDate(todayISO())}</span>
          <span>Control Financiero · Ser Humano</span>
        </div>
      </div>
    </>
  );
}
