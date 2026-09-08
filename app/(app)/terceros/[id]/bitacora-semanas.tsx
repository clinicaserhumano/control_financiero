"use client";

import { useMemo, useState, useTransition } from "react";
import { calcularHorasSemana, money, todayISO } from "@/lib/calculos";
import { cargarSemanasEnConjunto } from "./bitacora-actions";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import WeekCard from "./week-card";
import type { DiaSemana } from "@/lib/types";

type Semana = {
  id: string;
  etiqueta: string | null;
  dias: DiaSemana[];
  movimiento: { id: string; estado: "pendiente" | "confirmado" | "anulado"; monto: number } | null;
};

export default function BitacoraSemanas({
  semanas,
  terceroId,
  precioHora,
}: {
  semanas: Semana[];
  terceroId: string;
  precioHora: number;
}) {
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const esAdmin = useEsAdmin();

  function toggle(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalSeleccion = useMemo(
    () =>
      semanas
        .filter((s) => seleccionadas.has(s.id))
        .reduce((sum, s) => sum + calcularHorasSemana(s.dias, precioHora).valor, 0),
    [semanas, seleccionadas, precioHora]
  );

  function submitCargarConjunto(formData: FormData) {
    startTransition(async () => {
      const result = await cargarSemanasEnConjunto(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError("");
        setSeleccionadas(new Set());
      }
    });
  }

  return (
    <div>
      {semanas.map((s) => (
        <WeekCard
          key={s.id}
          semanaId={s.id}
          terceroId={terceroId}
          etiquetaInicial={s.etiqueta || ""}
          diasIniciales={s.dias}
          precioHora={precioHora}
          movimiento={s.movimiento}
          seleccionable={!s.movimiento}
          seleccionada={seleccionadas.has(s.id)}
          onToggleSeleccion={() => toggle(s.id)}
        />
      ))}

      {seleccionadas.size > 1 && (
        <div className="sticky bottom-3 z-10 mt-3 rounded-xl bg-carbon text-white px-4 py-3 shadow-lg border-l-4 border-amber flex items-center gap-3 flex-wrap">
          <div className="font-bold text-[13px] whitespace-nowrap">
            <b className="text-amber">{seleccionadas.size}</b> semana(s) seleccionada(s) · {money(totalSeleccion)}
          </div>
          <form action={submitCargarConjunto} className="flex items-center gap-2 flex-wrap ml-auto">
            {[...seleccionadas].map((id) => (
              <input key={id} type="hidden" name="semana_ids" value={id} />
            ))}
            <input type="hidden" name="tercero_id" value={terceroId} />
            <input type="date" name="fecha" disabled={!esAdmin} defaultValue={todayISO()} className="finput !w-auto !py-1.5 !text-xs" />
            <BotonAdmin type="submit" disabled={pending} className="btn-gold btn-sm">
              {pending ? "…" : "Cargar semanas seleccionadas juntas"}
            </BotonAdmin>
          </form>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setSeleccionadas(new Set())}>
            Limpiar
          </button>
        </div>
      )}
      {error && <div className="alert-error mt-3">{error}</div>}
    </div>
  );
}
