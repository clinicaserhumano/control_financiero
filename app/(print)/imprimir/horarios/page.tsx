import { createClient } from "@/lib/supabase/server";
import { fmtDate, todayISO } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto, formatearHorario } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { Tercero } from "@/lib/types";

export default async function ImprimirHorariosPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const listaIds = (ids || "").split(",").filter(Boolean);
  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();

  const { data: personal } = listaIds.length
    ? await supabase.from("terceros").select("*").in("id", listaIds)
    : { data: [] };

  const ordenados = ((personal ?? []) as Tercero[]).slice().sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)));

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref="/reportes?modo=horarios" />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Horario del Personal</div>
            <div className="badge">{ordenados.length} persona(s)</div>
          </div>
        </div>

        {ordenados.length === 0 ? (
          <p className="fhint" style={{ marginTop: 6 }}>
            No se seleccionó a nadie.
          </p>
        ) : (
          <table className="reporte">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Grupo</th>
                <th>Tarea</th>
                <th>Horario</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((t) => (
                <tr key={t.id}>
                  <td>{nombreCompleto(t)}</td>
                  <td>{TERCERO_TIPO_LABEL[t.tipo]}</td>
                  <td>{t.tarea || "—"}</td>
                  <td>{formatearHorario(t.horario) || "Sin horario establecido"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
