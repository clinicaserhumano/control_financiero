"use client";

import { useActionState, useState, useTransition } from "react";
import { calcularHorasSemana, money, todayISO } from "@/lib/calculos";
import { agregarSemana, eliminarSemana, guardarDiasSemana, cargarSemana, type CargarSemanaState } from "./bitacora-actions";
import type { DiaSemana } from "@/lib/types";

type MovimientoLigado = { id: string; estado: "pendiente" | "confirmado" | "anulado"; monto: number } | null;

export function BotonAgregarSemana({ terceroId }: { terceroId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn-primary" onClick={() => startTransition(() => agregarSemana(terceroId))}>
      {pending ? "…" : "+ Agregar semana"}
    </button>
  );
}

export default function WeekCard({
  semanaId,
  terceroId,
  etiquetaInicial,
  diasIniciales,
  precioHora,
  movimiento,
}: {
  semanaId: string;
  terceroId: string;
  etiquetaInicial: string;
  diasIniciales: DiaSemana[];
  precioHora: number;
  movimiento: MovimientoLigado;
}) {
  const [etiqueta, setEtiqueta] = useState(etiquetaInicial);
  const [dias, setDias] = useState<DiaSemana[]>(diasIniciales);
  const [pendienteGuardar, startTransition] = useTransition();
  const [cargarState, cargarAction, cargando] = useActionState<CargarSemanaState, FormData>(cargarSemana, null);

  const bloqueada = movimiento != null && movimiento.estado !== "pendiente";
  const { horas, valor } = calcularHorasSemana(dias, precioHora);

  function actualizarDia(i: number, campo: keyof DiaSemana, valorCampo: string) {
    setDias((prev) => prev.map((d, idx) => (idx === i ? { ...d, [campo]: valorCampo } : d)));
  }

  return (
    <div className="border border-border rounded-[10px] mb-4 overflow-hidden">
      <div className="bg-[#f4f5f8] px-3.5 py-2.5 flex items-center gap-2.5 flex-wrap">
        <span className="font-bold text-[13px] text-carbon">Semana:</span>
        <input
          type="text"
          disabled={bloqueada}
          placeholder="Ej: 11 al 16 de mayo 2026"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
          className="finput !w-auto max-w-[280px]"
        />
        <span className="ml-auto font-extrabold tabular-nums text-primary-dark text-[13px]">
          {horas.toFixed(2)} h · {money(valor)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Día</th>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Almuerzo (min)</th>
              <th className="td-num">Horas</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d, i) => {
              const h = calcularHorasSemana([d], precioHora).horas;
              return (
                <tr key={d.dia}>
                  <td className="font-semibold whitespace-nowrap">{d.dia}</td>
                  <td>
                    <input
                      type="date"
                      disabled={bloqueada}
                      value={d.fecha}
                      onChange={(e) => actualizarDia(i, "fecha", e.target.value)}
                      className="finput !py-1.5 !text-xs"
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      disabled={bloqueada}
                      value={d.entrada}
                      onChange={(e) => actualizarDia(i, "entrada", e.target.value)}
                      className="finput !py-1.5 !text-xs"
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      disabled={bloqueada}
                      value={d.salida}
                      onChange={(e) => actualizarDia(i, "salida", e.target.value)}
                      className="finput !py-1.5 !text-xs"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      disabled={bloqueada}
                      placeholder="min"
                      value={d.almuerzo}
                      onChange={(e) => actualizarDia(i, "almuerzo", e.target.value)}
                      className="finput !py-1.5 !text-xs"
                    />
                  </td>
                  <td className="td-num font-semibold">
                    {h.toFixed(2)} h
                    {(d.entrada || d.salida) && (!d.entrada || !d.salida) && (
                      <div className="text-[10px] font-normal text-danger">
                        falta {!d.entrada ? "entrada" : "salida"}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      disabled={bloqueada}
                      placeholder="feriado, permiso…"
                      value={d.nota}
                      onChange={(e) => actualizarDia(i, "nota", e.target.value)}
                      className="finput !py-1.5 !text-xs"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3.5 py-3 border-t border-border flex items-center gap-2.5 flex-wrap">
        {movimiento ? (
          <span
            className={
              "pill " +
              (movimiento.estado === "confirmado"
                ? ""
                : movimiento.estado === "pendiente"
                  ? "!bg-[#fdf3df] !text-[#8a6d12]"
                  : "!bg-[#fbeaea] !text-danger")
            }
          >
            {movimiento.estado === "confirmado" ? "✓ Pagada" : movimiento.estado === "pendiente" ? "En cuentas por pagar" : "Anulada"}
          </span>
        ) : (
          <span className="fhint mt-0">Llena la asistencia y pulsa Cargar semana</span>
        )}

        {!bloqueada && (
          <form action={cargarAction} className="flex items-center gap-2 ml-auto flex-wrap">
            <input type="hidden" name="semana_id" value={semanaId} />
            <input type="hidden" name="tercero_id" value={terceroId} />
            <input type="hidden" name="etiqueta" value={etiqueta} />
            <input type="hidden" name="dias" value={JSON.stringify(dias)} />
            <input type="date" name="fecha" defaultValue={todayISO()} className="finput !w-auto !py-1.5 !text-xs" />
            <button
              type="button"
              disabled={pendienteGuardar}
              onClick={() => startTransition(() => guardarDiasSemana(semanaId, terceroId, etiqueta, dias))}
              className="btn-ghost btn-sm"
            >
              {pendienteGuardar ? "…" : "Guardar avance"}
            </button>
            <button type="submit" disabled={cargando} className="btn-gold btn-sm">
              {cargando ? "…" : movimiento ? "Recargar semana" : "Cargar semana"}
            </button>
            {!movimiento && (
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => {
                  if (confirm("¿Eliminar esta semana?")) startTransition(() => eliminarSemana(semanaId, terceroId));
                }}
              >
                Eliminar
              </button>
            )}
          </form>
        )}
      </div>
      {cargarState?.error && (
        <div className="text-[13px] font-semibold text-danger bg-[#fbeaea] border-t border-[#f3d3d3] px-3.5 py-2">
          {cargarState.error}
        </div>
      )}
    </div>
  );
}
