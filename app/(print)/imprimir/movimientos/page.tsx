import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConRelaciones = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null } | null;
  cuenta: { empresa: string; banco: string; numero: string } | null;
};

type SP = { tipo?: string; desde?: string; hasta?: string; cuenta?: string; tercero?: string; tipoMov?: string; q?: string };

export default async function ImprimirMovimientosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tipo: "ingreso" | "egreso" = sp.tipo === "egreso" ? "egreso" : "ingreso";
  const supabase = await createClient();

  let query = supabase
    .from("movimientos_financieros")
    .select("*, tipo_movimiento:tipos_movimiento(nombre), tercero:terceros(nombre,apellido), cuenta:cuentas(empresa,banco,numero)")
    .eq("tipo", tipo);
  if (sp.cuenta) query = query.eq("cuenta_id", sp.cuenta);
  if (sp.tercero) query = query.eq("tercero_id", sp.tercero);
  if (sp.tipoMov) query = query.eq("tipo_movimiento_id", sp.tipoMov);
  if (sp.desde) query = query.gte("fecha", sp.desde);
  if (sp.hasta) query = query.lte("fecha", sp.hasta);
  if (sp.q) query = query.ilike("concepto", `%${sp.q}%`);
  query = query.order("fecha", { ascending: true }).order("creado_en", { ascending: true });

  const { data: movimientos } = await query;
  const lista = (movimientos ?? []) as unknown as MovConRelaciones[];
  // Confirmado y pendiente se muestran por separado (un pendiente aún no salió
  // de ninguna cuenta); los anulados quedan en el listado (auditoría) pero no suman.
  const totalConfirmado = lista.filter((m) => m.estado === "confirmado").reduce((s, m) => s + Number(m.monto || 0), 0);
  const totalPendiente = lista.filter((m) => m.estado === "pendiente").reduce((s, m) => s + Number(m.monto || 0), 0);

  let periodo = "Todas las fechas";
  if (sp.desde && sp.hasta) periodo = `${fmtDate(sp.desde)} al ${fmtDate(sp.hasta)}`;
  else if (sp.desde) periodo = `Desde ${fmtDate(sp.desde)}`;
  else if (sp.hasta) periodo = `Hasta ${fmtDate(sp.hasta)}`;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={`/movimientos?tipo=${tipo}`} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">{tipo === "ingreso" ? "Reporte de Ingresos" : "Reporte de Egresos"}</div>
            <div className="badge">
              Período: {periodo} · {lista.length} registro(s)
            </div>
          </div>
        </div>
        <div className="sum">
          <div>
            Confirmado
            <b>{money(totalConfirmado)}</b>
          </div>
          <div>
            Pendiente
            <b>{money(totalPendiente)}</b>
          </div>
        </div>
        <table className="reporte">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>{tipo === "ingreso" ? "Pagador" : "Beneficiario"}</th>
              <th>Concepto</th>
              <th>Cuenta</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id}>
                <td>{fmtDate(m.fecha)}</td>
                <td>{m.tipo_movimiento?.nombre || "—"}</td>
                <td>
                  {tipo === "ingreso" ? m.pagador || "—" : m.tercero ? nombreCompleto(m.tercero) : m.beneficiario || "—"}
                  {tipo === "egreso" && m.razon_egreso ? ` (${m.razon_egreso})` : ""}
                </td>
                <td>{m.concepto || "—"}</td>
                <td>{m.cuenta ? `${m.cuenta.banco} · ${m.cuenta.numero}` : "—"}</td>
                <td>{m.estado === "confirmado" ? "Confirmado" : m.estado === "pendiente" ? "Pendiente" : "Anulado"}</td>
                <td className="rt">{money(m.monto)}</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={6} style={{ textAlign: "right" }}>
                TOTAL CONFIRMADO
              </td>
              <td className="rt">{money(totalConfirmado)}</td>
            </tr>
            <tr className="total">
              <td colSpan={6} style={{ textAlign: "right" }}>
                TOTAL PENDIENTE
              </td>
              <td className="rt">{money(totalPendiente)}</td>
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
