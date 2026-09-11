import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, numeroALetras, todayISO, calcularHorasSemana, numerosEgresoPorCuenta } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { Cuenta, TipoMovimiento, Tercero } from "@/lib/types";

const datosMovimiento = cache(async (id: string) => {
  const supabase = await createClient();
  const { data: movimiento } = await supabase
    .from("movimientos_financieros")
    .select("*, cuenta:cuentas(*), tercero:terceros(*), tipo_movimiento:tipos_movimiento(*)")
    .eq("id", id)
    .single();
  if (!movimiento) return null;

  const m = movimiento as typeof movimiento & {
    cuenta: Cuenta | null;
    tercero: Tercero | null;
    tipo_movimiento: TipoMovimiento | null;
  };

  let numero: number | null = null;
  if (m.tipo === "egreso" && m.cuenta_id) {
    const { data: egresosCuenta } = await supabase
      .from("movimientos_financieros")
      .select("id,cuenta_id,creado_en")
      .eq("cuenta_id", m.cuenta_id)
      .eq("tipo", "egreso");
    numero = numerosEgresoPorCuenta(egresosCuenta ?? []).get(m.id) ?? null;
  }

  // Horas trabajadas detrás de este egreso, cuando viene de una (o varias,
  // cargadas juntas) semana de bitácora — para mostrarlas en la papeleta.
  let horas: number | null = null;
  if (m.origen === "nomina" && m.tercero) {
    const { data: semanas } = await supabase.from("semanas").select("dias").eq("movimiento_id", m.id);
    if (semanas && semanas.length) {
      horas = semanas.reduce((total, s) => total + calcularHorasSemana(s.dias, m.tercero!.precio_hora || 0).horas, 0);
    }
  }

  return { m, numero, horas };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const datos = await datosMovimiento(id);
  if (!datos) return {};
  const { m, numero } = datos;
  if (m.tipo === "egreso" && numero != null) {
    return { title: `Egreso ${numero} - ${m.cuenta?.empresa || ""}` };
  }
  return {};
}

export default async function ImprimirMovimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await obtenerPerfilActual();

  const datos = await datosMovimiento(id);
  if (!datos) notFound();
  const { m, numero, horas } = datos;

  const esEgreso = m.tipo === "egreso";
  const letras = numeroALetras(Number(m.monto));
  const referencia = (m.referencia || {}) as Record<string, string>;
  const camposExtra = m.tipo_movimiento?.campos_extra ?? [];

  return (
    <>
      <PrintStyles tamano="A5" />
      <PrintActions volverHref={esEgreso ? "/movimientos?tipo=egreso" : "/movimientos?tipo=ingreso"} />
      <div className="hoja">
        <PrintLogo />
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
            <div className="t">
              {esEgreso
                ? `EGRESO${m.tipo_movimiento?.nombre ? " DE " + m.tipo_movimiento.nombre.toUpperCase() : ""}`
                : "COMPROBANTE DE INGRESO"}
            </div>
            <div className="n">
              {esEgreso && numero != null ? `N° ${numero}` : m.tipo_movimiento?.nombre || (esEgreso ? "Egreso" : "Ingreso")}
            </div>
          </div>
        </div>

        <table className="meta">
          <tbody>
            <tr>
              <td style={{ width: "62%" }}>
                <span className="lbl">{esEgreso ? "A favor de (beneficiario)" : "Recibido de"}</span>
                <span className="v">
                  {esEgreso ? (m.tercero ? nombreCompleto(m.tercero) : m.beneficiario || "—") : m.pagador || "—"}
                </span>
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
            {m.razon_egreso && (
              <tr>
                <td colSpan={2}>
                  <span className="lbl">Razón del egreso</span>
                  <span className="v" style={{ fontWeight: 500 }}>
                    {m.razon_egreso}
                  </span>
                </td>
              </tr>
            )}
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
            {horas != null && (
              <tr>
                <td colSpan={2}>
                  <span className="lbl">Horas trabajadas y pagadas</span>
                  <span className="v" style={{ fontWeight: 600 }}>
                    {horas.toFixed(2)} horas
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
          <span>
            Documento generado el {fmtDate(todayISO())} por {perfil?.alias || perfil?.email || "—"}
          </span>
          <span>Control Financiero · Ser Humano</span>
        </div>
      </div>
    </>
  );
}
