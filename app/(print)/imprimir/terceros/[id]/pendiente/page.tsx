import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import PrintFooter from "@/components/print/print-footer";
import type { MovimientoFinanciero } from "@/lib/types";

// Documento corto: solo lo que todavía se debe, sin el historial de lo ya
// pagado — para cuando lo único que hace falta es un papel con "se le debe
// tanto", en vez del estado de cuenta completo.
export default async function ImprimirPendienteTerceroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();

  const { data: tercero } = await supabase.from("terceros").select("*").eq("id", id).single();
  if (!tercero) notFound();

  const [{ data: cuentaPaga }, { data: movimientos }] = await Promise.all([
    tercero.cuenta_id
      ? supabase.from("cuentas").select("empresa").eq("id", tercero.cuenta_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("movimientos_financieros")
      .select("*")
      .eq("tercero_id", id)
      .eq("tipo", "egreso")
      .eq("estado", "pendiente")
      .order("fecha", { ascending: true }),
  ]);

  const filas = (movimientos ?? []) as MovimientoFinanciero[];
  const total = filas.reduce((s, m) => s + Number(m.monto || 0), 0);

  return (
    <>
      <PrintStyles tamano="A5" />
      <PrintActions volverHref={`/terceros/${id}`} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Saldo Pendiente por Pagar</div>
            <div className="org">
              {nombreCompleto(tercero)}
              {tercero.cedula_ruc ? ` · ${tercero.cedula_ruc}` : ""}
            </div>
            <div className="meta">
              {[tercero.tarea, TERCERO_TIPO_LABEL[tercero.tipo], cuentaPaga ? `Paga: ${cuentaPaga.empresa}` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        </div>

        <table className="meta">
          <tbody>
            <tr>
              <td className="valbox" colSpan={2}>
                <span className="lbl">Total a pagar</span>
                <span className="valbig">{money(total)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="reporte">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={3}>No tiene ningún saldo pendiente por pagar.</td>
              </tr>
            ) : (
              filas.map((m) => (
                <tr key={m.id}>
                  <td>{fmtDate(m.fecha)}</td>
                  <td>{m.concepto || "—"}</td>
                  <td className="rt">{money(m.monto)}</td>
                </tr>
              ))
            )}
            {filas.length > 0 && (
              <tr className="total">
                <td colSpan={2} style={{ textAlign: "right" }}>
                  TOTAL
                </td>
                <td className="rt">{money(total)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <PrintFooter perfil={perfil} />
      </div>
    </>
  );
}
