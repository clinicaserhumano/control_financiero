"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { money, fmtDate } from "@/lib/calculos";
import { anularSeleccionados } from "../../cuentas-por-pagar/actions";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin, EnlaceAdmin } from "@/lib/auth/boton-admin";
import AnularButton from "../../movimientos/anular-button";
import type { MovimientoFinanciero } from "@/lib/types";

type MovConRelaciones = MovimientoFinanciero & {
  tipo_movimiento: { nombre: string } | null;
  cuenta: { empresa: string; banco: string; numero: string } | null;
};

// Igual que la selección múltiple de Cuentas por Pagar, pero acotada a un
// solo Personal — para cuando se acumularon varios pendientes de la misma
// persona y se van a pagar todos juntos con un solo cheque. Seleccionar 2 o
// más lleva a /movimientos/pagar-conjunto, la misma pantalla de "Registrar
// pago" pero con el concepto y el valor combinados.
export default function MovimientosTabla({
  movimientos,
  terceroId,
}: {
  movimientos: MovConRelaciones[];
  terceroId: string;
}) {
  const esAdmin = useEsAdmin();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [pendienteAnular, startTransition] = useTransition();

  const pendientes = useMemo(() => movimientos.filter((m) => m.estado === "pendiente"), [movimientos]);
  const todasSeleccionadas = pendientes.length > 0 && pendientes.every((m) => seleccion.has(m.id));
  const totalSeleccion = useMemo(
    () => movimientos.filter((m) => seleccion.has(m.id)).reduce((s, m) => s + Number(m.monto), 0),
    [movimientos, seleccion]
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
    setSeleccion(todasSeleccionadas ? new Set() : new Set(pendientes.map((m) => m.id)));
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                {pendientes.length > 1 && (
                  <input type="checkbox" disabled={!esAdmin} checked={todasSeleccionadas} onChange={toggleTodas} />
                )}
              </th>
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
            {movimientos.map((m) => (
              <tr key={m.id} className={m.estado === "anulado" ? "opacity-40" : ""}>
                <td>
                  {m.estado === "pendiente" && (
                    <input type="checkbox" disabled={!esAdmin} checked={seleccion.has(m.id)} onChange={() => toggle(m.id)} />
                  )}
                </td>
                <td>{fmtDate(m.fecha)}</td>
                <td>{m.tipo_movimiento?.nombre || (m.origen === "nomina" ? "Nómina" : "—")}</td>
                <td className="text-[12px] text-muted">{m.concepto || "—"}</td>
                <td className="text-[12px] text-muted">{m.cuenta ? `${m.cuenta.banco} · ${m.cuenta.numero}` : "—"}</td>
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
                  {m.retencion != null && m.retencion > 0 && (
                    <div className="text-[10px] font-normal text-muted">− {money(m.retencion)} ret.</div>
                  )}
                </td>
                <td>
                  <div className="flex gap-1.5 justify-end">
                    {m.estado === "pendiente" && (
                      <EnlaceAdmin href={`/movimientos/${m.id}/pagar?volver=/terceros/${terceroId}`} className="btn-gold btn-sm">
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

      {seleccion.size > 0 && (
        <div className="sticky bottom-3 z-10 mt-3 mx-4 rounded-xl bg-carbon text-white px-4 py-3 shadow-lg border-l-4 border-amber flex items-center gap-3 flex-wrap">
          <div className="font-bold text-[13px] whitespace-nowrap">
            <b className="text-amber">{seleccion.size}</b> seleccionado(s) · {money(totalSeleccion)}
          </div>
          {seleccion.size >= 2 ? (
            <EnlaceAdmin
              href={`/movimientos/pagar-conjunto?ids=${[...seleccion].join(",")}&volver=${encodeURIComponent(`/terceros/${terceroId}`)}`}
              className="btn-gold btn-sm"
            >
              Continuar con el pago →
            </EnlaceAdmin>
          ) : (
            <span className="text-[11.5px] text-white/70">Selecciona al menos 2 para combinarlos en un pago</span>
          )}
          <Link
            href={`/imprimir/movimientos/pendientes?ids=${[...seleccion].join(",")}&volver=${encodeURIComponent(`/terceros/${terceroId}`)}`}
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
