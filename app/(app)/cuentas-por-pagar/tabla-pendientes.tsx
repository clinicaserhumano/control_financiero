"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { money, fmtDate } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import { anularSeleccionados } from "./actions";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin, EnlaceAdmin } from "@/lib/auth/boton-admin";
import AnularButton from "../movimientos/anular-button";

type Pendiente = {
  id: string;
  fecha: string;
  concepto: string | null;
  monto: number;
  tercero: { id: string; nombre: string; apellido: string | null } | null;
};

export default function TablaPendientes({ pendientes }: { pendientes: Pendiente[] }) {
  const esAdmin = useEsAdmin();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [pendienteAnular, startTransition] = useTransition();

  const todasSeleccionadas = pendientes.length > 0 && pendientes.every((p) => seleccion.has(p.id));
  const totalSeleccion = useMemo(
    () => pendientes.filter((p) => seleccion.has(p.id)).reduce((s, p) => s + Number(p.monto), 0),
    [pendientes, seleccion]
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
    setSeleccion(todasSeleccionadas ? new Set() : new Set(pendientes.map((p) => p.id)));
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                <input type="checkbox" disabled={!esAdmin} checked={todasSeleccionadas} onChange={toggleTodas} />
              </th>
              <th>Fecha</th>
              <th>Personal</th>
              <th>Concepto</th>
              <th className="td-num">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pendientes.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-title">Sin cuentas por pagar</div>
                    No hay egresos pendientes con este filtro.
                  </div>
                </td>
              </tr>
            ) : (
              pendientes.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" disabled={!esAdmin} checked={seleccion.has(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td>{fmtDate(p.fecha)}</td>
                  <td className="font-semibold">
                    {p.tercero ? (
                      <Link href={`/terceros/${p.tercero.id}`} className="hover:underline hover:text-primary">
                        {nombreCompleto(p.tercero)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-[12px] text-muted">{p.concepto || "—"}</td>
                  <td className="td-num">{money(p.monto)}</td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      {p.tercero && (
                        <Link href={`/imprimir/terceros/${p.tercero.id}/pendiente`} className="btn-ghost btn-sm">
                          🖨️ Saldo pendiente
                        </Link>
                      )}
                      <EnlaceAdmin href={`/movimientos/${p.id}/pagar?volver=/cuentas-por-pagar`} className="btn-gold btn-sm">
                        Registrar pago
                      </EnlaceAdmin>
                      <AnularButton id={p.id} />
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
          {seleccion.size >= 2 ? (
            <EnlaceAdmin
              href={`/movimientos/pagar-conjunto?ids=${[...seleccion].join(",")}&volver=${encodeURIComponent("/cuentas-por-pagar")}`}
              className="btn-gold btn-sm"
            >
              Continuar con el pago →
            </EnlaceAdmin>
          ) : (
            <span className="text-[11.5px] text-white/70">Selecciona al menos 2 para combinarlos en un pago</span>
          )}
          <Link
            href={`/imprimir/movimientos/pendientes?ids=${[...seleccion].join(",")}&volver=${encodeURIComponent("/cuentas-por-pagar")}`}
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
