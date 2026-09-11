import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO, calcularHorasSemana, numerosEgresoPorCuenta } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto } from "@/lib/terceros";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import PrintLogo from "@/components/print/print-logo";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConNombres = MovimientoFinanciero & { tipo_movimiento: { nombre: string } | null };

// Cada movimiento confirmado se muestra en DOS filas — el cargo (cuando se
// prestó el servicio / se generó la deuda) y el abono (cuando se pagó, con
// el número de cheque u otra referencia) — para que el saldo corrido baje a
// $0.00 justo después de pagarse, igual que un estado de cuenta real. Un
// movimiento todavía pendiente solo aporta su fila de cargo, y ese saldo
// que no vuelve a bajar es exactamente el saldo por pagar.
type Fila = { fecha: string; concepto: string; valor: number | null; abono: number | null; saldo: number; obs: string };

export default async function ImprimirTerceroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();

  const { data: tercero } = await supabase.from("terceros").select("*").eq("id", id).single();
  if (!tercero) notFound();

  const [{ data: cuentaPaga }, { data: movimientos }, { data: semanas }] = await Promise.all([
    tercero.cuenta_id
      ? supabase.from("cuentas").select("empresa").eq("id", tercero.cuenta_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("movimientos_financieros")
      .select("*, tipo_movimiento:tipos_movimiento(nombre)")
      .eq("tercero_id", id)
      .neq("estado", "anulado")
      .order("fecha", { ascending: true })
      .order("creado_en", { ascending: true }),
    supabase.from("semanas").select("dias,movimiento_id").eq("tercero_id", id).not("movimiento_id", "is", null),
  ]);

  const lista = (movimientos ?? []) as unknown as MovConNombres[];

  // N° de egreso por cuenta — depende de TODOS los egresos de cada cuenta,
  // no solo de los de esta persona, por eso se trae aparte (liviano).
  const { data: egresosCuentas } = await supabase.from("movimientos_financieros").select("id,cuenta_id,creado_en").eq("tipo", "egreso");
  const numerosEgreso = numerosEgresoPorCuenta(
    (egresosCuentas ?? []) as { id: string; cuenta_id: string | null; creado_en: string }[]
  );

  // Horas trabajadas (y cuántas semanas de bitácora) detrás de cada cargo de
  // nómina — una carga conjunta liga varias semanas al mismo movimiento.
  const horasPorMovimiento = new Map<string, { horas: number; semanas: number }>();
  for (const s of semanas ?? []) {
    if (!s.movimiento_id) continue;
    const { horas } = calcularHorasSemana(s.dias, tercero.precio_hora || 0);
    const previo = horasPorMovimiento.get(s.movimiento_id) || { horas: 0, semanas: 0 };
    horasPorMovimiento.set(s.movimiento_id, { horas: previo.horas + horas, semanas: previo.semanas + 1 });
  }

  let saldo = 0;
  const filas: Fila[] = [];
  for (const m of lista) {
    const horasInfo = horasPorMovimiento.get(m.id);
    // Cargos importados de antes de usar la bitácora no tienen semanas
    // ligadas para sacar las horas reales — se estiman a partir del monto
    // pagado y el precio/hora, en vez de dejar la observación en blanco.
    const horasAprox = tercero.precio_hora ? Number(m.monto) / tercero.precio_hora : null;
    const obsCargo = horasInfo
      ? `${horasInfo.horas.toFixed(2)} h${horasInfo.semanas > 1 ? ` · ${horasInfo.semanas} sem.` : ""}`
      : m.observaciones
        ? m.observaciones
        : horasAprox
          ? `${horasAprox.toFixed(2)} h`
          : "—";
    saldo += Number(m.monto);
    filas.push({ fecha: m.fecha, concepto: m.concepto || "—", valor: Number(m.monto), abono: null, saldo, obs: obsCargo });

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
      filas.push({
        fecha: m.fecha_pago || m.fecha,
        concepto: m.concepto || "—",
        valor: null,
        abono: Number(m.monto),
        saldo,
        obs: obsPago,
      });
    }
  }

  const totalValor = filas.reduce((s, f) => s + (f.valor || 0), 0);
  const totalAbono = filas.reduce((s, f) => s + (f.abono || 0), 0);
  const saldoFinal = filas.length ? filas[filas.length - 1].saldo : 0;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={`/terceros/${id}`} />
      <div className="hoja">
        <PrintLogo />
        <div className="hd">
          <div>
            <div className="ttl">Estado de Cuenta</div>
            <div className="org">
              {nombreCompleto(tercero)}
              {tercero.cedula_ruc ? ` · ${tercero.cedula_ruc}` : ""}
            </div>
            <div className="meta">
              {[tercero.tarea, TERCERO_TIPO_LABEL[tercero.tipo], cuentaPaga ? `Paga: ${cuentaPaga.empresa}` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        </div>

        <table className="reporte">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th style={{ textAlign: "right" }}>Valor</th>
              <th style={{ textAlign: "right" }}>Abono</th>
              <th style={{ textAlign: "right" }}>Saldo</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={6}>Sin movimientos registrados.</td>
              </tr>
            ) : (
              filas.map((f, i) => (
                <tr key={i}>
                  <td>{fmtDate(f.fecha)}</td>
                  <td>{f.concepto}</td>
                  <td className="rt">{f.valor != null ? money(f.valor) : ""}</td>
                  <td className="rt">{f.abono != null ? money(f.abono) : ""}</td>
                  <td className="rt">{money(f.saldo)}</td>
                  <td>{f.obs}</td>
                </tr>
              ))
            )}
            <tr className="total">
              <td colSpan={2} style={{ textAlign: "right" }}>
                TOTALES
              </td>
              <td className="rt">{money(totalValor)}</td>
              <td className="rt">{money(totalAbono)}</td>
              <td className="rt">{money(saldoFinal)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div className="foot">
          <span>
            Generado el {fmtDate(todayISO())} por {perfil?.alias || perfil?.email || "—"}
          </span>
          <span>Saldo x pagar: {money(saldoFinal)}</span>
        </div>
      </div>
    </>
  );
}
