import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConNombres = MovimientoFinanciero & { tercero: { nombre: string; apellido: string | null } | null };

export default async function ImprimirCxPPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("movimientos_financieros")
    .select("*, tercero:terceros(nombre,apellido)")
    .eq("tipo", "egreso")
    .eq("estado", "pendiente");
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  query = query.order("fecha", { ascending: true });

  const { data: movimientos } = await query;
  const lista = (movimientos ?? []) as unknown as MovConNombres[];
  const total = lista.reduce((s, m) => s + Number(m.monto || 0), 0);

  let periodo = "Todas las fechas";
  if (desde && hasta) periodo = `${fmtDate(desde)} al ${fmtDate(hasta)}`;
  else if (desde) periodo = `Desde ${fmtDate(desde)}`;
  else if (hasta) periodo = `Hasta ${fmtDate(hasta)}`;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref="/cuentas-por-pagar" />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Cuentas por Pagar</div>
            <div className="badge">
              Período (fecha del cargo): {periodo} · {lista.length} registro(s)
            </div>
          </div>
        </div>
        <div className="sum">
          <div>
            Total pendiente
            <b>{money(total)}</b>
          </div>
        </div>
        <table className="reporte">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Personal</th>
              <th>Concepto</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id}>
                <td>{fmtDate(m.fecha)}</td>
                <td>{m.tercero ? nombreCompleto(m.tercero) : "—"}</td>
                <td>{m.concepto || "—"}</td>
                <td className="rt">{money(m.monto)}</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={3} style={{ textAlign: "right" }}>
                TOTAL PENDIENTE
              </td>
              <td className="rt">{money(total)}</td>
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
