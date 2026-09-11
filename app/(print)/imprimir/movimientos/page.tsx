import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO, calcularHorasSemana, numerosEgresoPorCuenta } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConRelaciones = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null; precio_hora: number | null } | null;
  cuenta: { empresa: string; banco: string; numero: string } | null;
};

type SP = {
  tipo?: string;
  desde?: string;
  hasta?: string;
  cuenta?: string;
  tercero?: string;
  tipoMov?: string;
  estado?: string;
  q?: string;
};

export default async function ImprimirMovimientosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tipo: "ingreso" | "egreso" = sp.tipo === "egreso" ? "egreso" : "ingreso";
  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();

  let query = supabase
    .from("movimientos_financieros")
    .select(
      "*, tipo_movimiento:tipos_movimiento(nombre), tercero:terceros(nombre,apellido,precio_hora), cuenta:cuentas(empresa,banco,numero)"
    )
    .eq("tipo", tipo);
  if (sp.cuenta) query = query.eq("cuenta_id", sp.cuenta);
  if (sp.tercero) query = query.eq("tercero_id", sp.tercero);
  if (sp.tipoMov) query = query.eq("tipo_movimiento_id", sp.tipoMov);
  // Los anulados nunca se imprimen (ver abajo), así que solo se reenvía el
  // filtro de estado cuando pide confirmado o pendiente puntualmente.
  if (sp.estado === "confirmado" || sp.estado === "pendiente") query = query.eq("estado", sp.estado);
  if (sp.desde) query = query.gte("fecha", sp.desde);
  if (sp.hasta) query = query.lte("fecha", sp.hasta);
  if (sp.q) {
    if (tipo === "ingreso") {
      query = query.or(`concepto.ilike.%${sp.q}%,pagador.ilike.%${sp.q}%`);
    } else {
      const { data: terceros_q } = await supabase
        .from("terceros")
        .select("id")
        .or(`nombre.ilike.%${sp.q}%,apellido.ilike.%${sp.q}%`);
      const idsTerceros_q = (terceros_q ?? []).map((t) => t.id);
      const condiciones = [`concepto.ilike.%${sp.q}%`, `beneficiario.ilike.%${sp.q}%`];
      if (idsTerceros_q.length) condiciones.push(`tercero_id.in.(${idsTerceros_q.join(",")})`);
      query = query.or(condiciones.join(","));
    }
  }
  query = query.order("fecha", { ascending: true }).order("creado_en", { ascending: true });

  const { data: movimientos } = await query;
  // Los anulados no se imprimen: un reporte impreso es para ver lo real
  // (confirmado y pendiente), no el historial de correcciones.
  const lista = ((movimientos ?? []) as unknown as MovConRelaciones[]).filter((m) => m.estado !== "anulado");
  const totalConfirmado = lista.filter((m) => m.estado === "confirmado").reduce((s, m) => s + Number(m.monto || 0), 0);
  const totalPendiente = lista.filter((m) => m.estado === "pendiente").reduce((s, m) => s + Number(m.monto || 0), 0);

  // N° de egreso por cuenta — depende de TODOS los egresos de cada cuenta,
  // no solo de los que quedaron en este reporte filtrado, por eso se trae
  // aparte (liviano: solo id/cuenta/fecha de creación).
  const numerosEgreso =
    tipo === "egreso"
      ? numerosEgresoPorCuenta(
          ((await supabase.from("movimientos_financieros").select("id,cuenta_id,creado_en").eq("tipo", "egreso")).data ?? []) as {
            id: string;
            cuenta_id: string | null;
            creado_en: string;
          }[]
        )
      : new Map<string, number>();

  // Horas trabajadas detrás de cada cargo de nómina (una carga conjunta liga
  // varias semanas al mismo movimiento) — mismo cálculo que el estado de
  // cuenta de personal, para que la columna Observación no quede en blanco.
  const idsNomina = lista.filter((m) => m.origen === "nomina").map((m) => m.id);
  const horasPorMovimiento = new Map<string, { horas: number; semanas: number }>();
  if (idsNomina.length) {
    const { data: semanas } = await supabase.from("semanas").select("dias,movimiento_id,tercero_id").in("movimiento_id", idsNomina);
    const precioHoraPorTercero = new Map(
      lista.filter((m) => m.tercero_id).map((m) => [m.tercero_id as string, m.tercero?.precio_hora || 0])
    );
    for (const s of semanas ?? []) {
      if (!s.movimiento_id) continue;
      const { horas } = calcularHorasSemana(s.dias, precioHoraPorTercero.get(s.tercero_id) || 0);
      const previo = horasPorMovimiento.get(s.movimiento_id) || { horas: 0, semanas: 0 };
      horasPorMovimiento.set(s.movimiento_id, { horas: previo.horas + horas, semanas: previo.semanas + 1 });
    }
  }

  let periodo = "Todas las fechas";
  if (sp.desde && sp.hasta) periodo = `${fmtDate(sp.desde)} al ${fmtDate(sp.hasta)}`;
  else if (sp.desde) periodo = `Desde ${fmtDate(sp.desde)}`;
  else if (sp.hasta) periodo = `Hasta ${fmtDate(sp.hasta)}`;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={`/movimientos?tipo=${tipo}`} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">{tipo === "ingreso" ? "Reporte de Ingresos" : "Reporte de Egresos"}</div>
            <div className="badge">
              Período: {periodo} · {lista.length} registro(s)
            </div>
          </div>
        </div>
        <div className="sum">
          <div>
            Confirmado
            <b>{money(totalConfirmado)}</b>
          </div>
          <div>
            Pendiente
            <b>{money(totalPendiente)}</b>
          </div>
        </div>
        <table className="reporte detalle-mov">
          <colgroup>
            {tipo === "egreso" ? (
              <>
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
              </>
            ) : (
              <>
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "6%" }} />
              </>
            )}
          </colgroup>
          <thead>
            <tr>
              {tipo === "egreso" && <th>N°</th>}
              <th>Fecha</th>
              <th>Tipo</th>
              <th>{tipo === "ingreso" ? "Pagador" : "Beneficiario"}</th>
              <th>Concepto</th>
              <th>Cuenta</th>
              {tipo === "egreso" && <th>Cheque / Ref.</th>}
              {tipo === "egreso" && <th>Observación</th>}
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => {
              const horasInfo = horasPorMovimiento.get(m.id);
              return (
                <tr key={m.id}>
                  {tipo === "egreso" && <td>{numerosEgreso.get(m.id) ?? "—"}</td>}
                  <td>{fmtDate(m.fecha)}</td>
                  <td>{m.tipo_movimiento?.nombre || "—"}</td>
                  <td>
                    {tipo === "ingreso" ? m.pagador || "—" : m.tercero ? nombreCompleto(m.tercero) : m.beneficiario || "—"}
                    {tipo === "egreso" && m.razon_egreso ? ` (${m.razon_egreso})` : ""}
                  </td>
                  <td>{m.concepto || "—"}</td>
                  <td>{m.cuenta ? `${m.cuenta.banco} · ${m.cuenta.numero}` : "—"}</td>
                  {tipo === "egreso" && (
                    <td>{Object.values(m.referencia || {}).filter(Boolean).join(" · ") || "—"}</td>
                  )}
                  {tipo === "egreso" && (
                    <td>
                      {horasInfo
                        ? `${horasInfo.horas.toFixed(2)} h${horasInfo.semanas > 1 ? ` · ${horasInfo.semanas} sem.` : ""}`
                        : m.observaciones
                          ? m.observaciones
                          : m.tercero?.precio_hora
                            ? `${(Number(m.monto) / m.tercero.precio_hora).toFixed(2)} h`
                            : "—"}
                    </td>
                  )}
                  <td>{m.estado === "confirmado" ? "Confirmado" : "Pendiente"}</td>
                  <td className="rt">{money(m.monto)}</td>
                </tr>
              );
            })}
            <tr className="total">
              <td colSpan={tipo === "egreso" ? 9 : 6} style={{ textAlign: "right" }}>
                TOTAL CONFIRMADO
              </td>
              <td className="rt">{money(totalConfirmado)}</td>
            </tr>
            <tr className="total">
              <td colSpan={tipo === "egreso" ? 9 : 6} style={{ textAlign: "right" }}>
                TOTAL PENDIENTE
              </td>
              <td className="rt">{money(totalPendiente)}</td>
            </tr>
          </tbody>
        </table>
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
