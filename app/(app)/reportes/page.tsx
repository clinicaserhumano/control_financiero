import { Fragment } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  movimientosConSaldo,
  saldoCuenta,
  money,
  fmtDate,
  totalPorTipoEstado,
  numerosEgresoPorCuenta,
  calcularHorasSemana,
} from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto } from "@/lib/terceros";
import type { Cuenta, MovimientoFinanciero, Tercero } from "@/lib/types";
import SeleccionarHorarios from "./seleccionar-horarios";

type ModoReporte = "cuenta" | "tercero" | "general" | "horarios";

type MovConNombres = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null } | null;
};

type Fila = { fecha: string; concepto: string; valor: number | null; abono: number | null; saldo: number; obs: string };

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; id?: string; desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const modo: ModoReporte =
    sp.modo === "tercero" ? "tercero" : sp.modo === "general" ? "general" : sp.modo === "horarios" ? "horarios" : "cuenta";
  const supabase = await createClient();

  const [{ data: cuentas }, { data: terceros }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("terceros").select("*").order("nombre"),
  ]);

  let resumen: { etiquetas: { label: string; valor: string }[] } | null = null;

  // ---- Datos para la tabla en vivo de "Por cuenta" ----
  let filasCuenta: (MovConNombres & { saldoAcumulado: number })[] = [];
  let numerosEgresoCuenta = new Map<string, number>();
  let cuentaSeleccionada: Cuenta | null = null;

  // ---- Datos para la tabla en vivo de "Por Personal" (estado de cuenta) ----
  const filasTercero: Fila[] = [];
  let terceroSeleccionado: Tercero | null = null;
  let cuentaPagaTercero: string | null = null;

  // ---- Datos para la tabla en vivo de "General" ----
  let filasPorCuenta: { cuenta: Cuenta; ingresos: number; egresos: number; saldo: number; movimientos: MovConNombres[] }[] = [];
  let filasPendientesGeneral: { tercero: Tercero; pendiente: number }[] = [];
  let totalPendienteGeneral = 0;

  if (sp.id && modo === "cuenta") {
    const [{ data: cuenta }, { data: movimientos }] = await Promise.all([
      supabase.from("cuentas").select("*").eq("id", sp.id).single(),
      supabase
        .from("movimientos_financieros")
        .select("*, tipo_movimiento:tipos_movimiento(nombre), tercero:terceros(nombre,apellido)")
        .eq("cuenta_id", sp.id),
    ]);
    cuentaSeleccionada = (cuenta ?? null) as Cuenta | null;
    const lista = (movimientos ?? []) as unknown as MovConNombres[];
    const conSaldo = movimientosConSaldo(lista) as (MovConNombres & { saldoAcumulado: number })[];
    numerosEgresoCuenta = numerosEgresoPorCuenta(lista.filter((m) => m.tipo === "egreso"));
    filasCuenta = conSaldo.filter((m) => (!sp.desde || m.fecha >= sp.desde) && (!sp.hasta || m.fecha <= sp.hasta));
    const saldoActual = conSaldo.length ? conSaldo[conSaldo.length - 1].saldoAcumulado : 0;
    resumen = {
      etiquetas: [
        { label: "Movimientos en el rango", valor: String(filasCuenta.length) },
        { label: "Saldo disponible actual", valor: money(saldoActual) },
      ],
    };
  } else if (sp.id && modo === "tercero") {
    const [{ data: tercero }, { data: movimientos }, { data: semanas }] = await Promise.all([
      supabase.from("terceros").select("*").eq("id", sp.id).single(),
      supabase
        .from("movimientos_financieros")
        .select("*, tipo_movimiento:tipos_movimiento(nombre)")
        .eq("tercero_id", sp.id)
        .neq("estado", "anulado")
        .order("fecha", { ascending: true })
        .order("creado_en", { ascending: true }),
      supabase.from("semanas").select("dias,movimiento_id").eq("tercero_id", sp.id).not("movimiento_id", "is", null),
    ]);
    terceroSeleccionado = (tercero ?? null) as Tercero | null;
    const lista = (movimientos ?? []) as unknown as (MovimientoFinanciero & { tipo_movimiento: { nombre: string } | null })[];

    if (terceroSeleccionado?.cuenta_id) {
      const { data: cuentaPaga } = await supabase.from("cuentas").select("empresa").eq("id", terceroSeleccionado.cuenta_id).single();
      cuentaPagaTercero = cuentaPaga?.empresa ?? null;
    }

    const { data: egresosCuentas } = await supabase.from("movimientos_financieros").select("id,cuenta_id,creado_en").eq("tipo", "egreso");
    const numerosEgreso = numerosEgresoPorCuenta(
      (egresosCuentas ?? []) as { id: string; cuenta_id: string | null; creado_en: string }[]
    );

    const horasPorMovimiento = new Map<string, { horas: number; semanas: number }>();
    for (const s of semanas ?? []) {
      if (!s.movimiento_id) continue;
      const { horas } = calcularHorasSemana(s.dias, terceroSeleccionado?.precio_hora || 0);
      const previo = horasPorMovimiento.get(s.movimiento_id) || { horas: 0, semanas: 0 };
      horasPorMovimiento.set(s.movimiento_id, { horas: previo.horas + horas, semanas: previo.semanas + 1 });
    }

    let saldo = 0;
    for (const m of lista) {
      const horasInfo = horasPorMovimiento.get(m.id);
      const horasAprox = terceroSeleccionado?.precio_hora ? Number(m.monto) / terceroSeleccionado.precio_hora : null;
      const obsCargo = horasInfo
        ? `${horasInfo.horas.toFixed(2)} h${horasInfo.semanas > 1 ? ` · ${horasInfo.semanas} sem.` : ""}`
        : m.observaciones
          ? m.observaciones
          : horasAprox
            ? `${horasAprox.toFixed(2)} h`
            : "—";
      saldo += Number(m.monto);
      filasTercero.push({ fecha: m.fecha, concepto: m.concepto || "—", valor: Number(m.monto), abono: null, saldo, obs: obsCargo });

      if (m.estado === "confirmado") {
        const referencia = (m.referencia || {}) as Record<string, string>;
        const valores = Object.values(referencia).filter(Boolean);
        let obsPago = referencia.cheque
          ? `Cheque ${referencia.cheque}`
          : valores.length
            ? valores.join(" · ")
            : m.tipo_movimiento?.nombre || "Pagado";
        const numeroEgreso = numerosEgreso.get(m.id);
        if (numeroEgreso != null) obsPago += ` · Egreso N° ${numeroEgreso}`;
        if (m.descuento) obsPago += ` · Desc. ${money(m.descuento)}`;
        saldo -= Number(m.monto);
        filasTercero.push({ fecha: m.fecha_pago || m.fecha, concepto: m.concepto || "—", valor: null, abono: Number(m.monto), saldo, obs: obsPago });
      }
    }

    resumen = {
      etiquetas: [
        { label: "Movimientos en el rango", valor: String(filasTercero.length) },
        { label: "Saldo x pagar", valor: money(totalPorTipoEstado(lista, "egreso", "pendiente")) },
      ],
    };
  } else if (modo === "general") {
    const { data: movimientos } = await supabase
      .from("movimientos_financieros")
      .select("*, tipo_movimiento:tipos_movimiento(nombre), tercero:terceros(nombre,apellido)");
    const lista = (movimientos ?? []) as unknown as MovConNombres[];
    const enRango = lista
      .filter((m) => (!sp.desde || m.fecha >= sp.desde) && (!sp.hasta || m.fecha <= sp.hasta))
      .filter((m) => m.estado !== "anulado");

    filasPorCuenta = (cuentas ?? []).map((c: Cuenta) => {
      const movsCuenta = lista.filter((m) => m.cuenta_id === c.id);
      const movsCuentaRango = enRango
        .filter((m) => m.cuenta_id === c.id)
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.creado_en || "").localeCompare(b.creado_en || ""));
      return {
        cuenta: c,
        ingresos: totalPorTipoEstado(movsCuentaRango, "ingreso", "confirmado"),
        egresos: totalPorTipoEstado(movsCuentaRango, "egreso", "confirmado"),
        saldo: saldoCuenta(movsCuenta),
        movimientos: movsCuentaRango,
      };
    });
    const totalIngresos = filasPorCuenta.reduce((s, f) => s + f.ingresos, 0);
    const totalEgresos = filasPorCuenta.reduce((s, f) => s + f.egresos, 0);
    const totalSaldo = filasPorCuenta.reduce((s, f) => s + f.saldo, 0);

    const pendientePorTercero = new Map<string, number>();
    enRango.forEach((m) => {
      if (!m.tercero_id || m.tipo !== "egreso" || m.estado !== "pendiente") return;
      pendientePorTercero.set(m.tercero_id, (pendientePorTercero.get(m.tercero_id) ?? 0) + Number(m.monto || 0));
    });
    filasPendientesGeneral = ((terceros ?? []) as Tercero[])
      .map((t) => ({ tercero: t, pendiente: pendientePorTercero.get(t.id) ?? 0 }))
      .filter((f) => f.pendiente > 0)
      .sort((a, b) => b.pendiente - a.pendiente);
    totalPendienteGeneral = filasPendientesGeneral.reduce((s, f) => s + f.pendiente, 0);

    resumen = {
      etiquetas: [
        { label: "Ingresos del período", valor: money(totalIngresos) },
        { label: "Egresos del período", valor: money(totalEgresos) },
        { label: "Saldo total en cuentas (actual)", valor: money(totalSaldo) },
        { label: "Total pendiente por pagar", valor: money(totalPendienteGeneral) },
      ],
    };
  }

  const hrefImprimir =
    modo === "general" ? "/imprimir/general" : sp.id && `/imprimir/${modo === "cuenta" ? "cuentas" : "terceros"}/${sp.id}`;
  const mostrarResumen = modo === "general" || (sp.id && resumen);

  return (
    <div>
      <p className="text-[12.5px] text-muted -mt-1.5 mb-[18px]">
        Genera el reporte de una cuenta, de una persona, o el resumen general de todo el sistema, listo para imprimir en A4.
      </p>

      <div className="flex gap-1.5 mb-4">
        <Link
          href="/reportes?modo=cuenta"
          className={"rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold " + (modo === "cuenta" ? "bg-carbon border-carbon text-white" : "bg-surface border-border text-[var(--color-muted)] hover:border-primary")}
        >
          Por cuenta
        </Link>
        <Link
          href="/reportes?modo=tercero"
          className={"rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold " + (modo === "tercero" ? "bg-carbon border-carbon text-white" : "bg-surface border-border text-[var(--color-muted)] hover:border-primary")}
        >
          Por Personal
        </Link>
        <Link
          href="/reportes?modo=general"
          className={"rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold " + (modo === "general" ? "bg-carbon border-carbon text-white" : "bg-surface border-border text-[var(--color-muted)] hover:border-primary")}
        >
          General (todo)
        </Link>
        <Link
          href="/reportes?modo=horarios"
          className={"rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold " + (modo === "horarios" ? "bg-carbon border-carbon text-white" : "bg-surface border-border text-[var(--color-muted)] hover:border-primary")}
        >
          Horarios
        </Link>
      </div>

      {modo === "horarios" ? (
        <div className="card">
          <div className="card-b">
            <p className="fhint mb-4">
              Elige a quiénes incluir e imprime solo su horario establecido (sin el detalle día por día de la
              bitácora).
            </p>
            <SeleccionarHorarios
              personal={(terceros ?? []).filter((t) => t.tipo === "empleado" || t.tipo === "afiliado")}
            />
          </div>
        </div>
      ) : (
      <div className="card">
        <div className="card-b">
          <form method="get" className="flex gap-3 flex-wrap items-end">
            <input type="hidden" name="modo" value={modo} />
            {modo === "cuenta" && (
              <div className="field mb-0" style={{ minWidth: 240 }}>
                <label className="flabel flabel-req">Cuenta</label>
                <select name="id" defaultValue={sp.id || ""} className="finput">
                  <option value="">— Selecciona —</option>
                  {(cuentas ?? []).map((c: Cuenta) => (
                    <option key={c.id} value={c.id}>
                      {c.empresa} — {c.banco} {c.numero}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {modo === "tercero" && (
              <div className="field mb-0" style={{ minWidth: 240 }}>
                <label className="flabel flabel-req">Personal</label>
                <select name="id" defaultValue={sp.id || ""} className="finput">
                  <option value="">— Selecciona —</option>
                  {(terceros ?? []).map((t: Tercero) => (
                    <option key={t.id} value={t.id}>
                      {[t.nombre, t.apellido].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {modo === "general" && (
              <p className="fhint mb-0" style={{ minWidth: 240 }}>
                Resumen de todas las cuentas y todo el personal con saldo pendiente.
              </p>
            )}
            <div className="field mb-0">
              <label className="flabel">Desde</label>
              <input type="date" name="desde" defaultValue={sp.desde || ""} className="finput" />
            </div>
            <div className="field mb-0">
              <label className="flabel">Hasta</label>
              <input type="date" name="hasta" defaultValue={sp.hasta || ""} className="finput" />
            </div>
            <button type="submit" className="btn-ghost btn-sm">
              Generar
            </button>
          </form>

          {mostrarResumen && resumen && (
            <div className="mt-5">
              {hrefImprimir && (
                <Link
                  href={`${hrefImprimir}?desde=${sp.desde || ""}&hasta=${sp.hasta || ""}`}
                  className="btn-navy mb-4"
                  style={{ fontSize: 15, padding: "13px 22px" }}
                >
                  🖨️ Imprimir reporte
                </Link>
              )}

              <div className="grid grid-cols-2 gap-3.5 mb-5">
                {resumen.etiquetas.map((e) => (
                  <div className="stat" key={e.label}>
                    <div className="lbl">{e.label}</div>
                    <div className="val">{e.valor}</div>
                  </div>
                ))}
              </div>

              {/* ---- Tabla en vivo: Por cuenta ---- */}
              {modo === "cuenta" && cuentaSeleccionada && (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Fecha</th>
                        <th>Movimiento</th>
                        <th>Detalle</th>
                        <th>Cheque / Ref.</th>
                        <th className="td-num">Ingreso</th>
                        <th className="td-num">Egreso</th>
                        <th className="td-num">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filasCuenta.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty-state">
                              <div className="empty-title">Sin movimientos</div>
                              No hay movimientos confirmados en el rango elegido.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filasCuenta.map((m) => (
                          <tr key={m.id}>
                            <td className="text-[11px] text-muted">{m.tipo === "egreso" ? numerosEgresoCuenta.get(m.id) ?? "—" : ""}</td>
                            <td>{fmtDate(m.fecha)}</td>
                            <td>{m.tipo_movimiento?.nombre || (m.tipo === "ingreso" ? "Ingreso" : "Egreso")}</td>
                            <td className="text-[11px] text-muted">
                              {[m.tercero ? `${m.tercero.nombre} ${m.tercero.apellido || ""}`.trim() : null, m.concepto]
                                .filter(Boolean)
                                .join(" · ")}
                            </td>
                            <td className="text-[11px] text-muted">
                              {Object.values(m.referencia || {}).filter(Boolean).join(" · ") || "—"}
                            </td>
                            <td className="td-num text-primary-dark">{m.tipo === "ingreso" ? money(m.monto) : ""}</td>
                            <td className="td-num">{m.tipo === "egreso" ? money(m.monto) : ""}</td>
                            <td className={"td-num font-bold " + (m.saldoAcumulado < 0 ? "text-danger" : "text-ink")}>
                              {money(m.saldoAcumulado)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ---- Tabla en vivo: Por Personal (estado de cuenta) ---- */}
              {modo === "tercero" && terceroSeleccionado && (
                <>
                  <div className="fhint mt-0 mb-2.5">
                    {[terceroSeleccionado.tarea, TERCERO_TIPO_LABEL[terceroSeleccionado.tipo], cuentaPagaTercero ? `Paga: ${cuentaPagaTercero}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Concepto</th>
                          <th className="td-num">Valor</th>
                          <th className="td-num">Abono</th>
                          <th className="td-num">Saldo</th>
                          <th>Observación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasTercero.length === 0 ? (
                          <tr>
                            <td colSpan={6}>
                              <div className="empty-state">
                                <div className="empty-title">Sin movimientos</div>
                                {nombreCompleto(terceroSeleccionado)} todavía no tiene movimientos registrados.
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filasTercero.map((f, i) => (
                            <tr key={i}>
                              <td>{fmtDate(f.fecha)}</td>
                              <td className="text-[12px] text-muted">{f.concepto}</td>
                              <td className="td-num">{f.valor != null ? money(f.valor) : ""}</td>
                              <td className="td-num text-primary-dark">{f.abono != null ? money(f.abono) : ""}</td>
                              <td className="td-num font-bold">{money(f.saldo)}</td>
                              <td className="text-[12px] text-muted">{f.obs}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ---- Tabla en vivo: General ---- */}
              {modo === "general" && (
                <>
                  <div className="overflow-x-auto mb-5">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Dirección</th>
                          <th>Concepto</th>
                          <th>Estado</th>
                          <th className="td-num">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasPorCuenta.map((f) => (
                          <Fragment key={f.cuenta.id}>
                            <tr>
                              <td colSpan={5} className="font-bold bg-[var(--color-ghost-bg)]">
                                {f.cuenta.empresa} — {f.cuenta.banco} · {f.cuenta.numero}
                                <span className="font-normal text-muted text-[11px] ml-2.5">
                                  Ingresos {money(f.ingresos)} · Egresos {money(f.egresos)} · Saldo actual {money(f.saldo)}
                                </span>
                              </td>
                            </tr>
                            {f.movimientos.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-muted italic">
                                  Sin movimientos en el período
                                </td>
                              </tr>
                            ) : (
                              f.movimientos.map((m) => (
                                <tr key={m.id}>
                                  <td>{fmtDate(m.fecha)}</td>
                                  <td>{m.tipo === "ingreso" ? "Ingreso" : "Egreso"}</td>
                                  <td className="text-[12px] text-muted">{m.concepto || m.tipo_movimiento?.nombre || "—"}</td>
                                  <td>{m.estado === "confirmado" ? "Confirmado" : "Pendiente"}</td>
                                  <td className="td-num">{money(m.monto)}</td>
                                </tr>
                              ))
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filasPendientesGeneral.length > 0 && (
                    <div className="overflow-x-auto">
                      <div className="fhint mt-0 mb-2">Personal con saldo pendiente por pagar</div>
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Grupo</th>
                            <th className="td-num">Pendiente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filasPendientesGeneral.map((f) => (
                            <tr key={f.tercero.id}>
                              <td>{nombreCompleto(f.tercero)}</td>
                              <td className="text-[12px] text-muted">{TERCERO_TIPO_LABEL[f.tercero.tipo]}</td>
                              <td className="td-num">{money(f.pendiente)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={2} className="text-right font-bold">
                              TOTAL PENDIENTE
                            </td>
                            <td className="td-num font-bold">{money(totalPendienteGeneral)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
