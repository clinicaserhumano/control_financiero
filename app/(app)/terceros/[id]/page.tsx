import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, totalPorTipoEstado } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto, direccionParaTercero, formatearHorario } from "@/lib/terceros";
import { EnlaceAdmin } from "@/lib/auth/boton-admin";
import type { Cuenta, MovimientoFinanciero, Tercero, TipoMovimiento } from "@/lib/types";
import FormularioMovimiento from "@/components/formulario-movimiento";
import ToggleActivoButton from "../toggle-activo-button";
import { BotonAgregarSemana } from "./week-card";
import BitacoraSemanas from "./bitacora-semanas";
import AnularButton from "../../movimientos/anular-button";
import AsignarDiaPago from "./asignar-dia-pago";
import InfoBoton from "@/components/ayuda/info-boton";

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

  const { data: tercero } = await supabase.from("terceros").select("*").eq("id", id).single();
  if (!tercero) notFound();

  const direccion = direccionParaTercero();
  // "Servicios prestados" = terceros tipo 'empleado' con sueldo asignado (ver lib/terceros.ts).
  const tieneBitacora = tercero.tipo === "empleado" && tercero.sueldo != null;
  const tieneHorario = tercero.tipo === "empleado" || tercero.tipo === "afiliado";
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
            <div className="text-lg font-extrabold text-ink flex items-center gap-2">
              {nombreCompleto(tercero as Tercero)}
              <InfoBoton titulo="Ficha de Personal" ancla="personal">
                <p className="m-0">
                  <b>Saldo x pagar</b> es la suma de sus egresos pendientes. <b>Movimientos</b> lista su historial
                  completo; si es Servicios prestados, la pestaña <b>Bitácora semanal</b> permite cargar la
                  asistencia y generar el cargo automáticamente.
                </p>
                <p className="m-0">
                  <b>Imprimir estado de cuenta</b> muestra cargo y abono por separado con saldo corrido, horas
                  trabajadas y el cheque/N° de egreso de cada pago.
                </p>
              </InfoBoton>
            </div>
            <div className="text-[13px] text-muted">
              {TERCERO_TIPO_LABEL[tercero.tipo]}
              {tercero.tarea ? ` · ${tercero.tarea}` : ""}
              {tercero.cedula_ruc ? ` · ${tercero.cedula_ruc}` : ""}
            </div>
            {(tercero.tipo === "empleado" || tercero.tipo === "afiliado") && formatearHorario(tercero.horario) && (
              <div className="text-[12.5px] text-ink font-semibold mt-1">Horario: {formatearHorario(tercero.horario)}</div>
            )}
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
              🖨️ Imprimir estado de cuenta
            </Link>
            {tieneHorario && (
              <Link href={`/imprimir/terceros/${id}/horario`} className="btn-navy btn-sm">
                🖨️ Imprimir horario
              </Link>
            )}
            {tieneHorario && <AsignarDiaPago terceroId={tercero.id} diaPagoInicial={tercero.dia_pago} />}
          </div>
        </div>
      </div>

      {tieneBitacora && (
        <div className="flex gap-1 border-b border-border mt-5 mb-5">
          <Link
            href={`/terceros/${id}?sub=bitacora`}
            className={
              "px-3.5 py-2.5 text-[13px] font-bold border-b-[3px] " +
              (subActiva === "bitacora" ? "text-ink border-primary" : "text-muted border-transparent")
            }
          >
            Bitácora semanal
          </Link>
          <Link
            href={`/terceros/${id}?sub=movimientos`}
            className={
              "px-3.5 py-2.5 text-[13px] font-bold border-b-[3px] " +
              (subActiva === "movimientos" ? "text-ink border-primary" : "text-muted border-transparent")
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
              <div className="empty-title">Sin semanas registradas</div>
              Agrega una semana para cargar la asistencia.
            </div>
          ) : (
            <BitacoraSemanas semanas={semanasOrdenadas} terceroId={id} precioHora={tercero.precio_hora || 0} />
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
                  <div className="empty-title">Sin movimientos</div>
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
                        <tr key={m.id} className={m.estado === "anulado" ? "opacity-40" : ""}>
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
                                    ? "pill-warning"
                                    : "pill-danger")
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
                            <div className="flex gap-1.5 justify-end">
                              {m.estado === "pendiente" && (
                                <EnlaceAdmin href={`/movimientos/${m.id}/pagar?volver=/terceros/${id}`} className="btn-gold btn-sm">
                                  Registrar pago
                                </EnlaceAdmin>
                              )}
                              {m.estado !== "anulado" && <AnularButton id={m.id} />}
                            </div>
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
