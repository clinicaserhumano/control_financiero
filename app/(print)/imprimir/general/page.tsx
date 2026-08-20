import { createClient } from "@/lib/supabase/server";
import { saldoCuenta, totalPorTipoEstado, money, fmtDate, todayISO } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto } from "@/lib/terceros";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import type { Cuenta, MovimientoFinanciero, Tercero } from "@/lib/types";

export default async function ImprimirGeneralPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  const [{ data: cuentas }, { data: movimientos }, { data: terceros }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("movimientos_financieros").select("tipo,estado,monto,fecha,creado_en,cuenta_id,tercero_id"),
    supabase.from("terceros").select("*").eq("activo", true).order("nombre"),
  ]);

  const lista = (movimientos ?? []) as (MovimientoFinanciero & { cuenta_id: string | null; tercero_id: string | null })[];
  const enRango = lista.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta));

  const filasCuentas = (cuentas ?? []).map((c: Cuenta) => {
    const movsCuenta = lista.filter((m) => m.cuenta_id === c.id);
    const movsCuentaRango = enRango.filter((m) => m.cuenta_id === c.id);
    return {
      cuenta: c,
      ingresos: totalPorTipoEstado(movsCuentaRango, "ingreso", "confirmado"),
      egresos: totalPorTipoEstado(movsCuentaRango, "egreso", "confirmado"),
      saldo: saldoCuenta(movsCuenta),
    };
  });
  const totalIngresos = filasCuentas.reduce((s, f) => s + f.ingresos, 0);
  const totalEgresos = filasCuentas.reduce((s, f) => s + f.egresos, 0);
  const totalSaldo = filasCuentas.reduce((s, f) => s + f.saldo, 0);

  const pendientePorTercero = new Map<string, number>();
  enRango.forEach((m) => {
    if (!m.tercero_id || m.tipo !== "egreso" || m.estado !== "pendiente") return;
    pendientePorTercero.set(m.tercero_id, (pendientePorTercero.get(m.tercero_id) ?? 0) + Number(m.monto || 0));
  });
  const filasPendientes = ((terceros ?? []) as Tercero[])
    .map((t) => ({ tercero: t, pendiente: pendientePorTercero.get(t.id) ?? 0 }))
    .filter((f) => f.pendiente > 0)
    .sort((a, b) => b.pendiente - a.pendiente);
  const totalPendiente = filasPendientes.reduce((s, f) => s + f.pendiente, 0);

  let periodo = "Todas las fechas";
  if (desde && hasta) periodo = `${fmtDate(desde)} al ${fmtDate(hasta)}`;
  else if (desde) periodo = `Desde ${fmtDate(desde)}`;
  else if (hasta) periodo = `Hasta ${fmtDate(hasta)}`;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref="/reportes?modo=general" />
      <div className="hoja">
        <div className="hd">
          <div>
            <div className="ttl">Reporte General</div>
            <div className="badge">Período: {periodo}</div>
          </div>
        </div>

        <div className="sum">
          <div>
            Ingresos del período
            <b>{money(totalIngresos)}</b>
          </div>
          <div>
            Egresos del período
            <b>{money(totalEgresos)}</b>
          </div>
          <div>
            Saldo total en cuentas
            <b>{money(totalSaldo)}</b>
          </div>
          <div>
            Total pendiente por pagar
            <b>{money(totalPendiente)}</b>
          </div>
        </div>

        <table className="reporte">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Banco / N°</th>
              <th style={{ textAlign: "right" }}>Ingresos período</th>
              <th style={{ textAlign: "right" }}>Egresos período</th>
              <th style={{ textAlign: "right" }}>Saldo actual</th>
            </tr>
          </thead>
          <tbody>
            {filasCuentas.map((f) => (
              <tr key={f.cuenta.id}>
                <td>{f.cuenta.empresa}</td>
                <td>
                  {f.cuenta.banco} · {f.cuenta.numero}
                </td>
                <td className="rt">{money(f.ingresos)}</td>
                <td className="rt">{money(f.egresos)}</td>
                <td className="rt">{money(f.saldo)}</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={2} style={{ textAlign: "right" }}>
                TOTALES
              </td>
              <td className="rt">{money(totalIngresos)}</td>
              <td className="rt">{money(totalEgresos)}</td>
              <td className="rt">{money(totalSaldo)}</td>
            </tr>
          </tbody>
        </table>

        {filasPendientes.length > 0 && (
          <>
            <div className="badge" style={{ marginTop: 16 }}>
              Personal con saldo pendiente por pagar
            </div>
            <table className="reporte">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Grupo</th>
                  <th style={{ textAlign: "right" }}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {filasPendientes.map((f) => (
                  <tr key={f.tercero.id}>
                    <td>{nombreCompleto(f.tercero)}</td>
                    <td>{TERCERO_TIPO_LABEL[f.tercero.tipo]}</td>
                    <td className="rt">{money(f.pendiente)}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td colSpan={2} style={{ textAlign: "right" }}>
                    TOTAL PENDIENTE
                  </td>
                  <td className="rt">{money(totalPendiente)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <div className="foot">
          <span>Generado el {fmtDate(todayISO())}</span>
          <span>Control Financiero · Ser Humano</span>
        </div>
      </div>
    </>
  );
}
