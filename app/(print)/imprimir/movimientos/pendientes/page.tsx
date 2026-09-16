import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConNombres = MovimientoFinanciero & { tercero: { nombre: string; apellido: string | null } | null };

// Imprime, en un solo documento, un conjunto arbitrario de movimientos
// elegidos a mano con las casillas (en la ficha de Personal o en Cuentas por
// Pagar) — para cuando se quiere un papel con varios pendientes juntos sin
// necesariamente registrar el pago combinado todavía.
export default async function ImprimirMovimientosSeleccionadosPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; volver?: string }>;
}) {
  const { ids: idsParam, volver } = await searchParams;
  const ids = (idsParam || "").split(",").filter(Boolean);
  const volverHref = volver && volver.startsWith("/") ? volver : "/movimientos";

  if (ids.length === 0) notFound();

  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();

  const { data: movimientos } = await supabase
    .from("movimientos_financieros")
    .select("*, tercero:terceros(nombre,apellido)")
    .in("id", ids)
    .order("fecha", { ascending: true });

  const lista = (movimientos ?? []) as unknown as MovConNombres[];
  const total = lista.reduce((s, m) => s + Number(m.monto || 0), 0);

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={volverHref} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Detalle de Pendientes Seleccionados</div>
            <div className="badge">{lista.length} registro(s)</div>
          </div>
        </div>
        <div className="sum">
          <div>
            Total
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
                TOTAL
              </td>
              <td className="rt">{money(total)}</td>
            </tr>
          </tbody>
        </table>
        <div className="foot">
          <span>
            Generado el {fmtDate(todayISO())} por {perfil?.alias || perfil?.email || "—"}
          </span>
          <span>Control Financiero · Ser Humano</span>
        </div>
      </div>
    </>
  );
}
