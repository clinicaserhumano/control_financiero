import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, totalPorTipoEstado } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto, direccionParaTercero } from "@/lib/terceros";
import { rolDe } from "@/lib/auth/roles";
import type { Cuenta, MovimientoFinanciero, Tercero, TipoMovimiento } from "@/lib/types";
import FormularioMovimiento from "@/components/formulario-movimiento";
import ToggleActivoButton from "../toggle-activo-button";
import WeekCard, { BotonAgregarSemana } from "./week-card";

type MovConRelaciones = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  cuenta: { empresa: string; banco: string; numero: string } | null;
};

export default async function TerceroDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { id } = await params;
  const { sub } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const esAdmin = rolDe(user?.email) === "admin";

  const { data: tercero } = await supabase.from("terceros").select("*").eq("id", id).single();
  if (!tercero) notFound();

  const direccion = direccionParaTercero();
  // "Servicios prestados" = terceros tipo 'empleado' con sueldo asignado (ver lib/terceros.ts).
  const tieneBitacora = tercero.tipo === "empleado" && tercero.sueldo != null;
  const subActiva = tieneBitacora && sub !== "movimientos" ? "bitacora" : "movimientos";

  const [{ data: cuentas }, { data: tiposMovimiento }, { data: movimientos }, { data: semanas }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("tipos_movimiento").select("*").eq("direccion", direccion).eq("activo", true).order("orden"),
    supabase
      .from("movimientos_financieros")
      .select("*, tipo_movimiento:tipos_movimiento(nombre), cuenta:cuentas(empresa,banco,numero)")
      .eq("tercero_id", id)
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false }),
    tieneBitacora
      ? supabase
          .from("semanas")
          .select("*, movimiento:movimientos_financieros(id,estado,monto)")
          .eq("tercero_id", id)
      : Promise.resolve({ data: null }),
  ]);

  const lista = (movimientos ?? []) as unknown as MovConRelaciones[];
  const pendiente = totalPorTipoEstado(lista, direccion, "pendiente");
  const confirmado = totalPorTipoEstado(lista, direccion, "confirmado");

  // `semanas` no tiene columna de fecha de creación en el esquema; se ordena
  // por la fecha del primer día capturado (más reciente primero) como mejor
  // aproximación cronológica disponible.
  const semanasOrdenadas = (semanas ?? [])
    .slice()
    .sort((a, b) => (b.dias?.[0]?.fecha || "").localeCompare(a.dias?.[0]?.fecha || ""));

  return (
    <div>
      <Link href={`/terceros?grupo=${tercero.tipo}`} className="btn-ghost btn-sm">
        ← Volver a la lista
      </Link>

      <div className="card mt-3.5">
        <div className="card-b flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="text-lg font-extrabold text-carbon">{nombreCompleto(tercero as Tercero)}</div>
            <div className="text-[13px] text-muted">
              {TERCERO_TIPO_LABEL[tercero.tipo]}
              {tercero.tarea ? ` · ${tercero.tarea}` : ""}
              {tercero.cedula_ruc ? ` · ${tercero.cedula_ruc}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted font-bold">Saldo x pagar</div>
            <div className="text-2xl font-extrabold tabular-nums">{money(pendiente)}</div>
          </div>
          <div className="flex flex-col gap-2">
            <ToggleActivoButton id={tercero.id} activo={tercero.activo} />
            <Link href={`/terceros?grupo=${tercero.tipo}&editar=${tercero.id}`} className="btn-ghost btn-sm">
              Editar datos
            </Link>
            <Link href={`/imprimir/terceros/${id}`} className="btn-navy btn-sm">
              ↦ Imprimir reporte
            </Link>
          </div>
        </div>
      </div>

      {tieneBitacora && (
        <div className="flex gap-1 border-b border-border mt-5 mb-5">
          <Link
            href={`/terceros/${id}?sub=bitacora`}
            className={
              "px-3.5 py-2.5 text-[13px] font-bold border-b-[3px] " +
              (subActiva === "bitacora" ? "text-carbon border-primary" : "text-muted border-transparent")
            }
          >
            Bitácora semanal
          </Link>
          <Link
            href={`/terceros/${id}?sub=movimientos`}
            className={
              "px-3.5 py-2.5 text-[13px] font-bold border-b-[3px] " +
              (subActiva === "movimientos" ? "text-carbon border-primary" : "text-muted border-transparent")
            }
          >
            Movimientos
          </Link>
        </div>
      )}

      {subActiva === "bitacora" && tieneBitacora ? (
        <div className="mt-5">
          <div className="mb-4">
            <BotonAgregarSemana terceroId={id} />
          </div>
          {semanasOrdenadas.length === 0 ? (
            <div className="empty-state">
              <div className="text-[15px] font-semibold text-[#475069] mb-1">Sin semanas registradas</div>
              Agrega una semana para cargar la asistencia.
            </div>
          ) : (
            semanasOrdenadas.map((s) => (
              <WeekCard
                key={s.id}
                semanaId={s.id}
                terceroId={id}
                etiquetaInicial={s.etiqueta || ""}
                diasIniciales={s.dias}
                precioHora={tercero.precio_hora || 0}
                movimiento={s.movimiento}
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[380px_1fr] mt-5">
          <FormularioMovimiento
            modo="crear"
            tipo={direccion}
            tiposMovimiento={(tiposMovimiento ?? []) as TipoMovimiento[]}
            cuentas={(cuentas ?? []) as Cuenta[]}
            terceroFijo={tercero as Tercero}
            redirectTo={`/terceros/${id}${tieneBitacora ? "?sub=movimientos" : ""}`}
          />

          <div className="card">
            <div className="card-h">
              <h2>Movimientos</h2>
              <span className="ml-auto text-[11px] text-muted font-semibold">
                {confirmado > 0 && `${money(confirmado)} confirmado(s)`}
              </span>
            </div>
            <div className="p-0">
              {lista.length === 0 ? (
                <div className="empty-state">
                  <div className="text-[15px] font-semibold text-[#475069] mb-1">Sin movimientos</div>
                  Registra el primero con el formulario de la izquierda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Concepto</th>
                        <th>Cuenta</th>
                        <th>Estado</th>
                        <th className="td-num">Valor</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((m) => (
                        <tr key={m.id}>
                          <td>{fmtDate(m.fecha)}</td>
                          <td>{m.tipo_movimiento?.nombre || (m.origen === "nomina" ? "Nómina" : "—")}</td>
                          <td className="text-[12px] text-muted">{m.concepto || "—"}</td>
                          <td className="text-[12px] text-muted">{m.cuenta ? `${m.cuenta.banco} · ${m.cuenta.numero}` : "—"}</td>
                          <td>
                            <span
                              className={
                                "pill " +
                                (m.estado === "confirmado"
                                  ? ""
                                  : m.estado === "pendiente"
                                    ? "!bg-[#fdf3df] !text-[#8a6d12]"
                                    : "!bg-[#fbeaea] !text-danger")
                              }
                            >
                              {m.estado === "confirmado" ? "Confirmado" : m.estado === "pendiente" ? "Pendiente" : "Anulado"}
                            </span>
                          </td>
                          <td className="td-num">
                            {money(m.monto)}
                            {m.descuento != null && m.descuento > 0 && (
                              <div className="text-[10px] font-normal text-muted">− {money(m.descuento)} desc.</div>
                            )}
                          </td>
                          <td>
                            {esAdmin && m.estado === "pendiente" && (
                              <Link href={`/movimientos/${m.id}/pagar?volver=/terceros/${id}`} className="btn-gold btn-sm">
                                Registrar pago
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
