import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, numeroALetras, todayISO } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import type { Cuenta, TipoMovimiento, Tercero } from "@/lib/types";

export default async function ImprimirMovimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: movimiento } = await supabase
    .from("movimientos_financieros")
    .select("*, cuenta:cuentas(*), tercero:terceros(*), tipo_movimiento:tipos_movimiento(*)")
    .eq("id", id)
    .single();

  if (!movimiento) notFound();

  const m = movimiento as typeof movimiento & {
    cuenta: Cuenta | null;
    tercero: Tercero | null;
    tipo_movimiento: TipoMovimiento | null;
  };

  const esEgreso = m.tipo === "egreso";
  const letras = numeroALetras(Number(m.monto));
  const referencia = (m.referencia || {}) as Record<string, string>;
  const camposExtra = m.tipo_movimiento?.campos_extra ?? [];

  return (
    <>
      <PrintStyles tamano="A5" />
      <PrintActions volverHref={esEgreso ? "/movimientos?tipo=egreso" : "/movimientos?tipo=ingreso"} />
      <div className="hoja">
        <div className="hd">
          <div>
            <div className="org">{m.cuenta?.empresa || "Sin cuenta asignada"}</div>
            {m.cuenta && (
              <>
                <div className="ruc">RUC: {m.cuenta.ruc}</div>
                <div className="bank">
                  {m.cuenta.banco} · {m.cuenta.tipo} {m.cuenta.numero}
                </div>
              </>
            )}
          </div>
          <div className="doc">
            <div className="t">{esEgreso ? "EGRESO" : "COMPROBANTE DE INGRESO"}</div>
            <div className="n">{m.tipo_movimiento?.nombre || (esEgreso ? "Egreso" : "Ingreso")}</div>
          </div>
        </div>

        <table className="meta">
          <tbody>
            <tr>
              <td style={{ width: "62%" }}>
                <span className="lbl">{esEgreso ? "A favor de (beneficiario)" : "Recibido de"}</span>
                <span className="v">{esEgreso ? (m.tercero ? nombreCompleto(m.tercero) : "—") : m.pagador || "—"}</span>
              </td>
              <td style={{ width: "38%" }}>
                <span className="lbl">Fecha</span>
                <span className="v">{fmtDate(m.fecha)}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="lbl">CED / RUC</span>
                <span className="v">{m.tercero?.cedula_ruc || "—"}</span>
              </td>
              <td className="valbox">
                <span className="lbl">Valor pagado (USD)</span>
                <span className="valbig">{money(m.monto)}</span>
              </td>
            </tr>
            {m.descuento != null && m.descuento > 0 && (
              <tr>
                <td colSpan={2}>
                  <span className="lbl">Descuento aplicado</span>
                  <span className="v" style={{ fontWeight: 500 }}>
                    Valor original {money(Number(m.monto) + Number(m.descuento))} − Descuento {money(m.descuento)} = Valor pagado{" "}
                    {money(m.monto)}
                  </span>
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2}>
                <span className="lbl">Son</span>
                <span className="letras">{letras}</span>
              </td>
            </tr>
            {m.concepto && (
              <tr>
                <td colSpan={2}>
                  <span className="lbl">Concepto</span>
                  <span className="v" style={{ fontWeight: 500 }}>
                    {m.concepto}
                  </span>
                </td>
              </tr>
            )}
            {m.observaciones && (
              <tr>
                <td colSpan={2}>
                  <span className="lbl">Observaciones</span>
                  <span className="v" style={{ fontWeight: 500 }}>
                    {m.observaciones}
                  </span>
                </td>
              </tr>
            )}
            {camposExtra.map((c) =>
              referencia[c.clave] ? (
                <tr key={c.clave}>
                  <td colSpan={2}>
                    <span className="lbl">{c.etiqueta}</span>
                    <span className="v" style={{ fontWeight: 500 }}>
                      {referencia[c.clave]}
                    </span>
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>

        {esEgreso && (
          <div className="firmas">
            <div className="firma">
              <div className="name">{m.cuenta?.elaborado || "Contabilidad"}</div>
              <div className="line"></div>
              <div className="role">Elaborado por</div>
            </div>
            <div className="firma">
              <div className="name">{m.cuenta?.aprobado || ""}</div>
              <div className="line"></div>
              <div className="role">Revisado / aprobado por</div>
            </div>
            <div className="firma">
              <div className="name">&nbsp;</div>
              <div className="line"></div>
              <div className="role">Recibí conforme · C.C. Nro.</div>
            </div>
          </div>
        )}

        <div className="foot">
          <span>Documento generado el {fmtDate(todayISO())}</span>
          <span>Control Financiero · Ser Humano</span>
        </div>
      </div>
    </>
  );
}
