import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/calculos";
import { TERCERO_TABS, nombreCompleto, type TerceroGrupo } from "@/lib/terceros";
import type { Cuenta, Tercero } from "@/lib/types";
import TerceroForm from "./tercero-form";
import ToggleActivoButton from "./toggle-activo-button";
import MostrarSelect from "./mostrar-select";

const GRUPOS = TERCERO_TABS.map((t) => t.grupo);

export default async function TercerosPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string; mostrar?: string; editar?: string }>;
}) {
  const { grupo, mostrar, editar } = await searchParams;
  const grupoActivo = (GRUPOS.includes(grupo as TerceroGrupo) ? grupo : "proveedor") as TerceroGrupo;
  const filtroMostrar = mostrar === "todos" || mostrar === "inactivos" ? mostrar : "activos";

  const supabase = await createClient();
  const [{ data: cuentas }, { data: terceros }, { data: movimientos }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("terceros").select("*").order("nombre"),
    supabase.from("movimientos_financieros").select("tercero_id,estado,monto"),
  ]);

  const listaCuentas = (cuentas ?? []) as Cuenta[];
  const listaTerceros = (terceros ?? []) as Tercero[];
  const terceroEditando = editar ? listaTerceros.find((t) => t.id === editar) ?? null : null;

  const pendientePorTercero = new Map<string, number>();
  (movimientos ?? []).forEach((m) => {
    if (!m.tercero_id || m.estado !== "pendiente") return;
    pendientePorTercero.set(m.tercero_id, (pendientePorTercero.get(m.tercero_id) ?? 0) + Number(m.monto || 0));
  });

  const delGrupo = listaTerceros.filter((t) => t.tipo === grupoActivo);
  const visibles = delGrupo.filter((t) =>
    filtroMostrar === "todos" ? true : filtroMostrar === "activos" ? t.activo : !t.activo
  );

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <TerceroForm
          key={terceroEditando?.id ?? "nuevo"}
          grupoActivo={grupoActivo}
          cuentas={listaCuentas}
          terceroEditando={terceroEditando}
        />

        <div>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {TERCERO_TABS.map((t) => {
              const count = listaTerceros.filter((x) => x.tipo === t.grupo && x.activo).length;
              const activo = t.grupo === grupoActivo;
              return (
                <Link
                  key={t.grupo}
                  href={`/terceros?grupo=${t.grupo}`}
                  className={
                    "flex items-center gap-1.5 rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold whitespace-nowrap " +
                    (activo
                      ? "bg-carbon border-carbon text-white"
                      : "bg-surface border-border text-[var(--color-muted)] hover:border-primary")
                  }
                >
                  {t.label}
                  <span
                    className={
                      "text-[10.5px] font-extrabold rounded-full px-1.5 " +
                      (activo ? "bg-white/20" : "bg-black/[.06] dark:bg-white/10")
                    }
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="card">
            <div className="card-h">
              <h2>{TERCERO_TABS.find((t) => t.grupo === grupoActivo)?.label}</h2>
              <form method="get" className="ml-auto flex items-center gap-2">
                <input type="hidden" name="grupo" value={grupoActivo} />
                <MostrarSelect defaultValue={filtroMostrar} />
                <noscript>
                  <button type="submit" className="btn-ghost btn-sm">
                    Filtrar
                  </button>
                </noscript>
              </form>
            </div>
            <div className="p-0">
              {visibles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">Sin registros</div>
                  No hay personal en este grupo con el filtro seleccionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Cédula/RUC</th>
                        <th>Tarea</th>
                        {grupoActivo === "empleado" && <th className="td-num">Precio/hora</th>}
                        <th className="td-num">Pendiente</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((t) => {
                        const pendiente = pendientePorTercero.get(t.id) ?? 0;
                        return (
                          <tr key={t.id}>
                            <td>
                              <Link href={`/terceros/${t.id}`} className="font-bold text-ink hover:text-primary">
                                {nombreCompleto(t)}
                              </Link>
                            </td>
                            <td className="mono text-muted">{t.cedula_ruc || "—"}</td>
                            <td>{t.tarea || "—"}</td>
                            {grupoActivo === "empleado" && (
                              <td className="td-num">{t.precio_hora != null ? money(t.precio_hora) : "—"}</td>
                            )}
                            <td className={"td-num font-bold " + (pendiente > 0 ? "text-primary-dark" : "text-muted")}>
                              {money(pendiente)}
                            </td>
                            <td>
                              <ToggleActivoButton id={t.id} activo={t.activo} />
                            </td>
                            <td>
                              <div className="flex gap-1.5 justify-end">
                                <Link href={`/terceros/${t.id}`} className="btn-navy btn-sm">
                                  Ver ficha
                                </Link>
                                <Link href={`/terceros?grupo=${grupoActivo}&editar=${t.id}`} className="btn-ghost btn-sm">
                                  Editar
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
