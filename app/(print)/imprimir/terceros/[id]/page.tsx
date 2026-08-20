import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, todayISO, totalPorTipoEstado } from "@/lib/calculos";
import { TERCERO_TIPO_LABEL, nombreCompleto, direccionParaTercero } from "@/lib/terceros";
import PrintStyles from "@/components/print/print-styles";
import PrintActions from "@/components/print/print-actions";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConNombres = MovimientoFinanciero & { tipo_movimiento: { nombre: string } | null };

export default async function ImprimirTerceroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { id } = await params;
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  const [{ data: tercero }, { data: movimientos }] = await Promise.all([
    supabase.from("terceros").select("*").eq("id", id).single(),
    supabase
      .from("movimientos_financieros")
      .select("*, tipo_movimiento:tipos_movimiento(nombre)")
      .eq("tercero_id", id)
      .order("fecha", { ascending: true }),
  ]);
  if (!tercero) notFound();

  const direccion = direccionParaTercero(tercero.tipo);
  const lista = (movimientos ?? []) as unknown as MovConNombres[];
  const filas = lista.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta));
  const pendiente = totalPorTipoEstado(lista, direccion, "pendiente");
  const confirmado = totalPorTipoEstado(filas, direccion, "confirmado");

  let periodo = "Todas las fechas";
  if (desde && hasta) periodo = `${fmtDate(desde)} al ${fmtDate(hasta)}`;
  else if (desde) periodo = `Desde ${fmtDate(desde)}`;
  else if (hasta) periodo = `Hasta ${fmtDate(hasta)}`;

  return (
    <>
      <PrintStyles tamano="A4" />
      <PrintActions volverHref={`/terceros/${id}`} />
      <div className="hoja">
        <div className="hd">
          <div>
            <div className="ttl">Reporte de Movimientos</div>
            <div className="org">
              {nombreCompleto(tercero)} · {TERCERO_TIPO_LABEL[tercero.tipo]}
            </div>
            {tercero.cedula_ruc && <div className="meta">CED/RUC: {tercero.cedula_ruc}</div>}
            <div className="badge">
              Período: {periodo} · {filas.length} movimiento(s)
            </div>
          </div>
        </div>
        <div className="sum">
          <div>
            {direccion === "ingreso" ? "Cobrado en el período" : "Pagado en el período"}
            <b>{money(confirmado)}</b>
          </div>
          <div>
            {direccion === "ingreso" ? "Pendiente por cobrar (total)" : "Saldo x pagar (total)"}
            <b>{money(pendiente)}</b>
          </div>
        </div>
        <table className="reporte">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((m) => (
              <tr key={m.id}>
                <td>{fmtDate(m.fecha)}</td>
                <td>{m.tipo_movimiento?.nombre || (m.origen === "nomina" ? "Nómina" : "—")}</td>
                <td>{m.concepto || "—"}</td>
                <td>{m.estado === "confirmado" ? "Confirmado" : m.estado === "pendiente" ? "Pendiente" : "Anulado"}</td>
                <td className="rt">{money(m.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="foot">
          <span>Generado el {fmtDate(todayISO())}</span>
          <span>Control Financiero · Ser Humano</span>
        </div>
      </div>
    </>
  );
}
