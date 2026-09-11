import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, todayISO, horaDecimal, calcularHorasSemana } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, ORDEN_DIAS, nombreCompleto, formatearHorario } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { Tercero } from "@/lib/types";

export default async function ImprimirHorarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();

  const [{ data: tercero }, { data: semanas }] = await Promise.all([
    supabase.from("terceros").select("*").eq("id", id).single(),
    supabase.from("semanas").select("*").eq("tercero_id", id),
  ]);
  if (!tercero) notFound();

  const semanasOrdenadas = (semanas ?? [])
    .slice()
    .sort((a, b) => (a.dias?.[0]?.fecha || "").localeCompare(b.dias?.[0]?.fecha || ""))
    .map((s) => ({ ...s, ...calcularHorasSemana(s.dias, tercero.precio_hora || 0) }));
  const totalHoras = semanasOrdenadas.reduce((sum, s) => sum + s.horas, 0);
  const totalValor = semanasOrdenadas.reduce((sum, s) => sum + s.valor, 0);

  const horarioPorDia = new Map((tercero.horario ?? []).map((h) => [h.dia, h]));

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={`/terceros/${id}`} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Horario y Asistencia</div>
            <div className="org">
              {nombreCompleto(tercero as Tercero)} · {TERCERO_TIPO_LABEL[tercero.tipo]}
            </div>
            {tercero.tarea && <div className="meta">{tercero.tarea}</div>}
          </div>
        </div>

        <div className="badge">Horario establecido</div>
        {formatearHorario(tercero.horario) ? (
          <table className="reporte" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>Día</th>
                <th style={{ textAlign: "right" }}>Entrada</th>
                <th style={{ textAlign: "right" }}>Salida</th>
              </tr>
            </thead>
            <tbody>
              {ORDEN_DIAS.filter((dia) => {
                const h = horarioPorDia.get(dia);
                return h?.entrada && h?.salida;
              }).map((dia) => {
                const h = horarioPorDia.get(dia);
                return (
                  <tr key={dia}>
                    <td>{dia}</td>
                    <td className="rt">{h?.entrada || "—"}</td>
                    <td className="rt">{h?.salida || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="fhint" style={{ marginTop: 6 }}>
            Sin horario establecido todavía.
          </p>
        )}

        <div className="badge" style={{ marginTop: 18 }}>
          Acumulados diarios
        </div>
        {semanasOrdenadas.length === 0 ? (
          <p className="fhint" style={{ marginTop: 6 }}>
            Sin semanas de bitácora registradas.
          </p>
        ) : (
          semanasOrdenadas.map((s) => (
            <div key={s.id} style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>{s.etiqueta || "Semana"}</div>
              <table className="reporte">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: "right" }}>Entrada</th>
                    <th style={{ textAlign: "right" }}>Salida</th>
                    <th style={{ textAlign: "right" }}>Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {s.dias.map((d, i) => {
                    let h = 0;
                    if (d.entrada && d.salida) {
                      h = horaDecimal(d.salida) - horaDecimal(d.entrada) - Number(d.almuerzo || 0) / 60;
                      if (h < 0 || isNaN(h)) h = 0;
                    }
                    return (
                      <tr key={i}>
                        <td>{d.dia}</td>
                        <td>{d.fecha ? fmtDate(d.fecha) : "—"}</td>
                        <td className="rt">{d.entrada || "—"}</td>
                        <td className="rt">{d.salida || "—"}</td>
                        <td className="rt">{h ? h.toFixed(2) : "—"}</td>
                      </tr>
                    );
                  })}
                  <tr className="total">
                    <td colSpan={4} style={{ textAlign: "right" }}>
                      Subtotal semana
                    </td>
                    <td className="rt">{s.horas.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )}

        <div className="sum" style={{ marginTop: 16 }}>
          <div>
            Total de horas registradas
            <b>{totalHoras.toFixed(2)}</b>
          </div>
          {tercero.precio_hora != null && (
            <div>
              Valor calculado (horas × precio/hora)
              <b>${totalValor.toFixed(2)}</b>
            </div>
          )}
        </div>

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
