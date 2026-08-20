import { Fragment } from "react";
import { createClient } from "@/lib/supabase/server";
import { saldoCuenta, totalPorTipoEstado, money, fmtDate, todayISO } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto } from "@/lib/terceros";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { Cuenta, MovimientoFinanciero, Tercero } from "@/lib/types";

type MovConRelaciones = MovimientoFinanciero & {
  cuenta_id: string | null;
  tercero_id: string | null;
  tipo_movimiento: { nombre: string } | null;
  cuenta: { empresa: string } | null;
};

export default async function ImprimirGeneralPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  const [{ data: cuentas }, { data: movimientos }, { data: terceros }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase
      .from("movimientos_financieros")
      .select("id,tipo,estado,monto,fecha,creado_en,concepto,cuenta_id,tercero_id,tipo_movimiento:tipos_movimiento(nombre),cuenta:cuentas(empresa)"),
    supabase.from("terceros").select("*").eq("activo", true).order("nombre"),
  ]);

  const lista = (movimientos ?? []) as unknown as MovConRelaciones[];
  const enRango = lista.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta));

  const filasCuentas = (cuentas ?? []).map((c: Cuenta) => {
    const movsCuenta = lista.filter((m) => m.cuenta_id === c.id);
    const movsCuentaRango = enRango
      .filter((m) => m.cuenta_id === c.id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.creado_en || "").localeCompare(b.creado_en || ""));
    return {
      cuenta: c,
      ingresos: totalPorTipoEstado(movsCuentaRango, "ingreso", "confirmado"),
      egresos: totalPorTipoEstado(movsCuentaRango, "egreso", "confirmado"),
      saldo: saldoCuenta(movsCuenta),
      movimientos: movsCuentaRango,
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
        <PrintLogo />
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

        <div className="badge" style={{ marginTop: 4 }}>
          Movimientos por cuenta
        </div>
        <table className="reporte detalle-mov">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "46%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Dirección</th>
              <th>Concepto</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {filasCuentas.map((f) => (
              <Fragment key={f.cuenta.id}>
                <tr className="grupo">
                  <td colSpan={5}>
                    {f.cuenta.empresa} — {f.cuenta.banco} · {f.cuenta.numero}
                    <span style={{ fontWeight: 400, color: "#6B7280", marginLeft: 10 }}>
                      Ingresos {money(f.ingresos)} · Egresos {money(f.egresos)} · Saldo actual {money(f.saldo)}
                    </span>
                  </td>
                </tr>
                {f.movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: "#9aa1ad", fontStyle: "italic" }}>
                      Sin movimientos en el período
                    </td>
                  </tr>
                ) : (
                  f.movimientos.map((m) => (
                    <tr key={m.id}>
                      <td>{fmtDate(m.fecha)}</td>
                      <td>{m.tipo === "ingreso" ? "Ingreso" : "Egreso"}</td>
                      <td>{m.concepto || m.tipo_movimiento?.nombre || "—"}</td>
                      <td>{m.estado === "confirmado" ? "Confirmado" : m.estado === "pendiente" ? "Pendiente" : "Anulado"}</td>
                      <td className="rt">{money(m.monto)}</td>
                    </tr>
                  ))
                )}
              </Fragment>
            ))}
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
