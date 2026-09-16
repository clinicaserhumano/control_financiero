"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { money, fmtDate } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import { anularSeleccionados } from "../cuentas-por-pagar/actions";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin, EnlaceAdmin } from "@/lib/auth/boton-admin";
import AnularButton from "./anular-button";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConRelaciones = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  tercero: { nombre: string; apellido: string | null; activo: boolean } | null;
  cuenta: { empresa: string; banco: string; numero: string } | null;
};

// Selección múltiple del listado de Ingresos/Egresos — a diferencia de la
// ficha de Personal y Cuentas por Pagar (donde solo hay pendientes), aquí
// puede haber confirmados y pendientes mezclados, así que no hay opción de
// "pagar combinado": solo imprimir o anular en bloque lo marcado.
export default function MovimientosListaTabla({
  pagina,
  tipo,
  numerosEgreso,
  volver,
}: {
  pagina: MovConRelaciones[];
  tipo: "ingreso" | "egreso";
  numerosEgreso: Record<string, number>;
  volver: string;
}) {
  const esAdmin = useEsAdmin();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [pendienteAnular, startTransition] = useTransition();

  const seleccionables = useMemo(() => pagina.filter((m) => m.estado !== "anulado"), [pagina]);
  const todasSeleccionadas = seleccionables.length > 0 && seleccionables.every((m) => seleccion.has(m.id));
  const totalSeleccion = useMemo(
    () => pagina.filter((m) => seleccion.has(m.id)).reduce((s, m) => s + Number(m.monto), 0),
    [pagina, seleccion]
  );

  function toggle(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodas() {
    setSeleccion(todasSeleccionadas ? new Set() : new Set(seleccionables.map((m) => m.id)));
  }

  const colSpanVacio = tipo === "egreso" ? 10 : 8;

  return (
    <div>
      <div className="overflow-x-auto mt-3.5">
        <table className="table-base">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                {seleccionables.length > 1 && (
                  <input type="checkbox" disabled={!esAdmin} checked={todasSeleccionadas} onChange={toggleTodas} />
                )}
              </th>
              {tipo === "egreso" && <th>N°</th>}
              <th>Fecha</th>
              <th>Tipo</th>
              <th>{tipo === "ingreso" ? "Pagador" : "Beneficiario"}</th>
              <th>Cuenta</th>
              {tipo === "egreso" && <th>Cheque / Ref.</th>}
              <th>Estado</th>
              <th className="td-num">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pagina.length === 0 ? (
              <tr>
                <td colSpan={colSpanVacio}>
                  <div className="empty-state">
                    <div className="empty-title">Sin {tipo === "ingreso" ? "ingresos" : "egresos"}</div>
                    Registra el primero con el formulario de la izquierda.
                  </div>
                </td>
              </tr>
            ) : (
              pagina.map((m) => (
                <tr key={m.id} className={m.estado === "anulado" ? "opacity-40" : ""}>
                  <td>
                    {m.estado !== "anulado" && (
                      <input type="checkbox" disabled={!esAdmin} checked={seleccion.has(m.id)} onChange={() => toggle(m.id)} />
                    )}
                  </td>
                  {tipo === "egreso" && <td className="text-[12px] text-muted">{numerosEgreso[m.id] ?? "—"}</td>}
                  <td>{fmtDate(m.fecha)}</td>
                  <td>{m.tipo_movimiento?.nombre || "—"}</td>
                  <td>
                    {tipo === "egreso" && m.tercero && m.tercero_id ? (
                      <Link
                        href={`/terceros/${m.tercero_id}`}
                        className={
                          "hover:underline " + (m.tercero.activo ? "font-semibold text-primary-dark" : "font-semibold text-muted")
                        }
                        title={m.tercero.activo ? "Personal/proveedor registrado y activo" : "Personal/proveedor registrado pero dado de baja"}
                      >
                        {nombreCompleto(m.tercero)}
                      </Link>
                    ) : (
                      <span>{tipo === "ingreso" ? m.pagador || "—" : m.beneficiario || "—"}</span>
                    )}
                    {tipo === "egreso" && m.razon_egreso && (
                      <div className="text-[10px] font-normal text-muted">{m.razon_egreso}</div>
                    )}
                  </td>
                  <td className="text-[12px] text-muted">{m.cuenta ? `${m.cuenta.banco} · ${m.cuenta.numero}` : "—"}</td>
                  {tipo === "egreso" && (
                    <td className="text-[12px] text-muted">
                      {Object.values(m.referencia || {}).filter(Boolean).join(" · ") || "—"}
                    </td>
                  )}
                  <td>
                    <span
                      className={
                        "pill " +
                        (m.estado === "confirmado" ? "" : m.estado === "pendiente" ? "pill-warning" : "pill-danger")
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
                      {m.estado !== "anulado" && (
                        <>
                          <Link href={`/imprimir/movimientos/${m.id}`} className="btn-navy btn-sm">
                            🖨️ Imprimir
                          </Link>
                          {m.estado === "confirmado" && (
                            <EnlaceAdmin href={`/movimientos/${m.id}/editar?volver=/movimientos?tipo=${tipo}`} className="btn-ghost btn-sm">
                              Editar
                            </EnlaceAdmin>
                          )}
                          <AnularButton id={m.id} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {seleccion.size > 0 && (
        <div className="sticky bottom-3 z-10 mt-3 mx-4 rounded-xl bg-carbon text-white px-4 py-3 shadow-lg border-l-4 border-amber flex items-center gap-3 flex-wrap">
          <div className="font-bold text-[13px] whitespace-nowrap">
            <b className="text-amber">{seleccion.size}</b> seleccionado(s) · {money(totalSeleccion)}
          </div>
          <Link
            href={`/imprimir/movimientos?tipo=${tipo}&ids=${[...seleccion].join(",")}&volver=${encodeURIComponent(volver)}`}
            className="btn-ghost btn-sm"
          >
            🖨️ Imprimir seleccionados
          </Link>
          <BotonAdmin
            disabled={pendienteAnular}
            className="btn-danger btn-sm"
            onClick={() => {
              if (!confirm(`¿Anular ${seleccion.size} registro(s) seleccionado(s)?`)) return;
              const ids = [...seleccion];
              startTransition(async () => {
                await anularSeleccionados(ids);
                setSeleccion(new Set());
              });
            }}
          >
            {pendienteAnular ? "…" : "Anular seleccionados"}
          </BotonAdmin>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setSeleccion(new Set())}>
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}
