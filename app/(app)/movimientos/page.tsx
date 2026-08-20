import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO, addDaysISO } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import type { Cuenta, Tercero, TipoMovimiento, MovimientoFinanciero } from "@/lib/types";
import FormularioMovimiento from "@/components/formulario-movimiento";
import AnularButton from "./anular-button";

const PAGINAS_OPCIONES = ["5", "10", "50", "todos"];

type MovConRelaciones = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null } | null;
  cuenta: { empresa: string; banco: string; numero: string } | null;
};

type SP = {
  tipo?: string;
  desde?: string;
  hasta?: string;
  todo?: string;
  cuenta?: string;
  tercero?: string;
  tipoMov?: string;
  q?: string;
  porPagina?: string;
  pagina?: string;
};

function construirHref(sp: SP, overrides: Record<string, string | null>) {
  const params = new URLSearchParams();
  const combinado: Record<string, string | undefined> = { ...sp, ...overrides };
  Object.entries(combinado).forEach(([k, v]) => {
    if (overrides[k] === null) return;
    if (v) params.set(k, v);
  });
  return `/movimientos?${params.toString()}`;
}

function construirHrefImprimir(sp: SP, tipo: string, desde?: string, hasta?: string) {
  const params = new URLSearchParams();
  params.set("tipo", tipo);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  if (sp.cuenta) params.set("cuenta", sp.cuenta);
  if (sp.tercero) params.set("tercero", sp.tercero);
  if (sp.tipoMov) params.set("tipoMov", sp.tipoMov);
  if (sp.q) params.set("q", sp.q);
  return `/imprimir/movimientos?${params.toString()}`;
}

export default async function MovimientosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tipo: "ingreso" | "egreso" = sp.tipo === "egreso" ? "egreso" : "ingreso";

  // El navegador de día (hoy por defecto) es un patrón exclusivo de Ingresos;
  // Egresos siempre arranca mostrando todo el historial, paginado.
  const fechasExplicitas = sp.desde !== undefined || sp.hasta !== undefined || sp.todo === "1";
  let desdeEfectivo: string | undefined;
  let hastaEfectivo: string | undefined;
  if (tipo === "ingreso" && !fechasExplicitas) {
    desdeEfectivo = hastaEfectivo = todayISO();
  } else if (sp.todo !== "1") {
    desdeEfectivo = sp.desde || undefined;
    hastaEfectivo = sp.hasta || undefined;
  }

  const porPaginaSel = PAGINAS_OPCIONES.includes(sp.porPagina || "") ? sp.porPagina! : "10";
  const porPagina = porPaginaSel === "todos" ? 1_000_000 : parseInt(porPaginaSel, 10);
  const paginaActual = Math.max(1, parseInt(sp.pagina || "1", 10) || 1);

  const supabase = await createClient();

  const [{ data: cuentas }, { data: terceros }, { data: tiposMovimiento }, { data: pagadoresRows }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("terceros").select("*").eq("activo", true).order("nombre"),
    supabase.from("tipos_movimiento").select("*").eq("direccion", tipo).eq("activo", true).order("orden"),
    tipo === "ingreso"
      ? supabase.from("movimientos_financieros").select("pagador").eq("tipo", "ingreso").not("pagador", "is", null)
      : Promise.resolve({ data: null }),
  ]);
  const pagadoresHistoricos = [...new Set((pagadoresRows ?? []).map((r) => r.pagador).filter(Boolean) as string[])].sort();

  let query = supabase
    .from("movimientos_financieros")
    .select("*, tipo_movimiento:tipos_movimiento(nombre), tercero:terceros(nombre,apellido), cuenta:cuentas(empresa,banco,numero)")
    .eq("tipo", tipo);
  if (sp.cuenta) query = query.eq("cuenta_id", sp.cuenta);
  if (sp.tercero && tipo === "egreso") query = query.eq("tercero_id", sp.tercero);
  if (sp.tipoMov) query = query.eq("tipo_movimiento_id", sp.tipoMov);
  if (desdeEfectivo) query = query.gte("fecha", desdeEfectivo);
  if (hastaEfectivo) query = query.lte("fecha", hastaEfectivo);
  if (sp.q) query = tipo === "ingreso" ? query.or(`concepto.ilike.%${sp.q}%,pagador.ilike.%${sp.q}%`) : query.ilike("concepto", `%${sp.q}%`);
  query = query.order("fecha", { ascending: false }).order("creado_en", { ascending: false });

  const { data: movimientos } = await query;
  const lista = (movimientos ?? []) as unknown as MovConRelaciones[];

  // Confirmado y pendiente se muestran por separado: un egreso pendiente
  // todavía no salió de ninguna cuenta, mezclarlo en un solo total daría a
  // entender que ya se pagó más de lo real. Los anulados no cuentan en ninguno.
  const totalConfirmado = lista.filter((m) => m.estado === "confirmado").reduce((s, m) => s + Number(m.monto || 0), 0);
  const totalPendiente = lista.filter((m) => m.estado === "pendiente").reduce((s, m) => s + Number(m.monto || 0), 0);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaSegura - 1) * porPagina;
  const pagina = lista.slice(inicio, inicio + porPagina);

  const diaBase = desdeEfectivo || hastaEfectivo || todayISO();

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <FormularioMovimiento
          modo="crear"
          tipo={tipo}
          tiposMovimiento={(tiposMovimiento ?? []) as TipoMovimiento[]}
          cuentas={(cuentas ?? []) as Cuenta[]}
          terceros={(terceros ?? []) as Tercero[]}
          pagadoresHistoricos={pagadoresHistoricos}
          redirectTo={`/movimientos?tipo=${tipo}`}
        />

        <div>
          <div className="grid grid-cols-3 gap-3.5 mb-4">
            <div className="stat">
              <div className="lbl">Registros en el listado</div>
              <div className="val">{lista.length}</div>
            </div>
            <div className="stat">
              <div className="lbl">Confirmado</div>
              <div className="val text-primary-dark">{money(totalConfirmado)}</div>
            </div>
            <div className="stat">
              <div className="lbl">Pendiente</div>
              <div className="val">{money(totalPendiente)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h2>{tipo === "ingreso" ? "Ingresos registrados" : "Egresos registrados"}</h2>
              <span className="ml-auto text-[11px] text-muted font-semibold">{lista.length} registro(s)</span>
            </div>
            <div className="p-0">
              {tipo === "ingreso" && (
                <div className="flex items-center gap-2 flex-wrap px-4 pt-3.5">
                  <Link href={construirHref(sp, { desde: addDaysISO(diaBase, -1), hasta: addDaysISO(diaBase, -1), todo: null, pagina: null })} className="btn-ghost btn-sm">
                    ‹ Día anterior
                  </Link>
                  <Link href={construirHref(sp, { desde: todayISO(), hasta: todayISO(), todo: null, pagina: null })} className="btn-gold btn-sm">
                    Hoy
                  </Link>
                  <Link href={construirHref(sp, { desde: addDaysISO(diaBase, 1), hasta: addDaysISO(diaBase, 1), todo: null, pagina: null })} className="btn-ghost btn-sm">
                    Día siguiente ›
                  </Link>
                  <span className="fhint mt-0 ml-1.5">
                    {sp.todo === "1"
                      ? "Mostrando: todo el historial"
                      : desdeEfectivo && desdeEfectivo === hastaEfectivo
                        ? `Mostrando: ${desdeEfectivo === todayISO() ? "Hoy · " : ""}${fmtDate(desdeEfectivo)}`
                        : desdeEfectivo || hastaEfectivo
                          ? `Mostrando: ${desdeEfectivo ? fmtDate(desdeEfectivo) : "…"} al ${hastaEfectivo ? fmtDate(hastaEfectivo) : "…"}`
                          : "Mostrando: todo el historial"}
                  </span>
                </div>
              )}

              <form method="get" className="flex gap-3 flex-wrap items-end px-4 pt-3.5">
                <input type="hidden" name="tipo" value={tipo} />
                <div className="field mb-0">
                  <label className="flabel">Desde</label>
                  <input type="date" name="desde" defaultValue={desdeEfectivo || ""} className="finput" />
                </div>
                <div className="field mb-0">
                  <label className="flabel">Hasta</label>
                  <input type="date" name="hasta" defaultValue={hastaEfectivo || ""} className="finput" />
                </div>
                <div className="field mb-0">
                  <label className="flabel">Cuenta</label>
                  <select name="cuenta" defaultValue={sp.cuenta || ""} className="finput">
                    <option value="">Todas</option>
                    {(cuentas ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.empresa}
                      </option>
                    ))}
                  </select>
                </div>
                {tipo === "egreso" && (
                  <div className="field mb-0">
                    <label className="flabel">Personal</label>
                    <select name="tercero" defaultValue={sp.tercero || ""} className="finput">
                      <option value="">Todos</option>
                      {(terceros ?? []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {nombreCompleto(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field mb-0">
                  <label className="flabel">Tipo</label>
                  <select name="tipoMov" defaultValue={sp.tipoMov || ""} className="finput">
                    <option value="">Todos</option>
                    {(tiposMovimiento ?? []).map((tm) => (
                      <option key={tm.id} value={tm.id}>
                        {tm.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field mb-0">
                  <label className="flabel">{tipo === "ingreso" ? "Buscar pagador / concepto" : "Buscar concepto"}</label>
                  <input type="text" name="q" defaultValue={sp.q || ""} className="finput" />
                </div>
                <div className="field mb-0" style={{ maxWidth: 110 }}>
                  <label className="flabel">Por página</label>
                  <select name="porPagina" defaultValue={porPaginaSel} className="finput">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="50">50</option>
                    <option value="todos">Todos</option>
                  </select>
                </div>
                <button type="submit" className="btn-ghost btn-sm">
                  Filtrar
                </button>
                <Link href={`/movimientos?tipo=${tipo}&todo=1`} className="btn-ghost btn-sm">
                  Ver todo el historial
                </Link>
                <Link href={construirHrefImprimir(sp, tipo, desdeEfectivo, hastaEfectivo)} className="btn-navy btn-sm ml-auto">
                  ↦ Imprimir rango (A4)
                </Link>
              </form>

              <div className="overflow-x-auto mt-3.5">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>{tipo === "ingreso" ? "Pagador" : "Beneficiario"}</th>
                      <th>Cuenta</th>
                      <th>Estado</th>
                      <th className="td-num">Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">
                            <div className="text-[15px] font-semibold text-[#475069] mb-1">
                              Sin {tipo === "ingreso" ? "ingresos" : "egresos"}
                            </div>
                            Registra el primero con el formulario de la izquierda.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagina.map((m) => (
                        <tr key={m.id}>
                          <td>{fmtDate(m.fecha)}</td>
                          <td>{m.tipo_movimiento?.nombre || "—"}</td>
                          <td>{tipo === "ingreso" ? m.pagador || "—" : m.tercero ? nombreCompleto(m.tercero) : "—"}</td>
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
                            <div className="flex gap-1.5 justify-end">
                              <Link href={`/imprimir/movimientos/${m.id}`} className="btn-navy btn-sm">
                                Imprimir
                              </Link>
                              {m.estado !== "anulado" && <AnularButton id={m.id} />}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {lista.length > 0 && (
                <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-t border-border">
                  <span className="fhint mt-0">
                    Mostrando {inicio + 1}–{Math.min(inicio + porPagina, lista.length)} de {lista.length}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <Link href={construirHref(sp, { pagina: "1" })} className="btn-ghost btn-sm">
                      «
                    </Link>
                    <Link href={construirHref(sp, { pagina: String(Math.max(1, paginaSegura - 1)) })} className="btn-ghost btn-sm">
                      ‹ Anterior
                    </Link>
                    <span className="text-[12.5px] font-bold text-carbon px-1">
                      Página {paginaSegura} de {totalPaginas}
                    </span>
                    <Link href={construirHref(sp, { pagina: String(Math.min(totalPaginas, paginaSegura + 1)) })} className="btn-ghost btn-sm">
                      Siguiente ›
                    </Link>
                    <Link href={construirHref(sp, { pagina: String(totalPaginas) })} className="btn-ghost btn-sm">
                      »
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
