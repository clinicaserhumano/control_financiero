"use client";

import { useState, useTransition } from "react";
import { guardarDiaPago } from "../actions";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import { DIA_SEMANA_LABEL, formatearDiaPago } from "@/lib/notificaciones";
import type { DiaPago } from "@/lib/types";

const DIAS_MES = Array.from({ length: 31 }, (_, i) => i + 1);

function GrillaDiaMes({ valor, onChange }: { valor: number; onChange: (d: number) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DIAS_MES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={
            "text-[11px] rounded-md py-1 font-semibold transition-colors " +
            (d === valor ? "bg-primary text-white" : "bg-[var(--color-surface-2)] text-ink hover:bg-primary/20")
          }
        >
          {d}
        </button>
      ))}
    </div>
  );
}

function GrillaDiaSemana({ valor, onChange }: { valor: number; onChange: (d: number) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DIA_SEMANA_LABEL.map((label, i) => (
        <button
          key={label}
          type="button"
          title={label}
          onClick={() => onChange(i)}
          className={
            "text-[11px] rounded-md py-1.5 font-semibold transition-colors " +
            (i === valor ? "bg-primary text-white" : "bg-[var(--color-surface-2)] text-ink hover:bg-primary/20")
          }
        >
          {label.slice(0, 3)}
        </button>
      ))}
    </div>
  );
}

export default function AsignarDiaPago({ terceroId, diaPagoInicial }: { terceroId: string; diaPagoInicial: DiaPago | null }) {
  const [abierto, setAbierto] = useState(false);
  const [frecuencia, setFrecuencia] = useState<DiaPago["frecuencia"]>(diaPagoInicial?.frecuencia ?? "semanal");
  const [dia, setDia] = useState(diaPagoInicial?.dia ?? 5);
  const [intervaloDias, setIntervaloDias] = useState(diaPagoInicial?.intervalo_dias ?? 15);
  const [fechaReferencia, setFechaReferencia] = useState(diaPagoInicial?.fecha_referencia ?? "");
  const [pending, startTransition] = useTransition();
  const esMensual = frecuencia === "mensual";
  const esQuincenal = frecuencia === "quincenal";
  const esSemanal = frecuencia === "semanal";
  const faltaConfigQuincenal = esQuincenal && (!fechaReferencia || !intervaloDias || intervaloDias < 1);

  function cambiarFrecuencia(nueva: DiaPago["frecuencia"]) {
    setFrecuencia(nueva);
    if (nueva === diaPagoInicial?.frecuencia) {
      setDia(diaPagoInicial.dia);
      setIntervaloDias(diaPagoInicial.intervalo_dias ?? 15);
      setFechaReferencia(diaPagoInicial.fecha_referencia ?? "");
    } else if (nueva === "semanal") {
      setDia(5);
    } else if (nueva === "mensual") {
      setDia(15);
    } else {
      setIntervaloDias(15);
      setFechaReferencia("");
    }
  }

  function guardar() {
    if (faltaConfigQuincenal) return;
    const valor: DiaPago = esQuincenal
      ? { frecuencia, dia: 0, intervalo_dias: Number(intervaloDias), fecha_referencia: fechaReferencia }
      : { frecuencia, dia: Number(dia), intervalo_dias: null, fecha_referencia: null };
    startTransition(async () => {
      await guardarDiaPago(terceroId, valor);
      setAbierto(false);
    });
  }

  function quitar() {
    startTransition(async () => {
      await guardarDiaPago(terceroId, null);
      setAbierto(false);
    });
  }

  return (
    <div className="relative">
      <BotonAdmin className="btn-navy btn-sm" onClick={() => setAbierto((v) => !v)}>
        {abierto ? "Cancelar" : "Asignar día de pago"}
      </BotonAdmin>
      {diaPagoInicial && !abierto && (
        <div className="text-[11px] text-muted mt-1 text-right">{formatearDiaPago(diaPagoInicial)}</div>
      )}
      {abierto && (
        <div className="absolute right-0 z-10 border border-border rounded-[10px] p-3 mt-2 bg-[var(--color-surface)] shadow-lg w-[280px]">
          <div className="field">
            <label className="flabel">Frecuencia</label>
            <select className="finput" value={frecuencia} onChange={(e) => cambiarFrecuencia(e.target.value as DiaPago["frecuencia"])}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          {esSemanal && (
            <div className="field mt-2">
              <label className="flabel">Día de la semana</label>
              <GrillaDiaSemana valor={dia} onChange={setDia} />
            </div>
          )}
          {esMensual && (
            <div className="field mt-2">
              <label className="flabel">Día del mes</label>
              <GrillaDiaMes valor={dia} onChange={setDia} />
            </div>
          )}
          {esQuincenal && (
            <>
              <div className="field mt-2">
                <label className="flabel">Repetir cada</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    className="finput !w-20"
                    value={intervaloDias}
                    onChange={(e) => setIntervaloDias(Number(e.target.value))}
                  />
                  <span className="text-[12.5px] text-muted font-semibold">días</span>
                </div>
                <div className="fhint">Ej: 11, 12, 13, 14… el número que corresponda.</div>
              </div>
              <div className="field mt-2">
                <label className="flabel">Fecha del próximo pago</label>
                <input
                  type="date"
                  className="finput"
                  value={fechaReferencia}
                  onChange={(e) => setFechaReferencia(e.target.value)}
                />
                <div className="fhint">Se repetirá cada {intervaloDias || "…"} días exactos desde esa fecha.</div>
              </div>
            </>
          )}
          <div className="flex gap-2 mt-3">
            <BotonAdmin disabled={pending || faltaConfigQuincenal} onClick={guardar} className="btn-primary btn-sm flex-1">
              {pending ? "…" : "Guardar"}
            </BotonAdmin>
            {diaPagoInicial && (
              <BotonAdmin disabled={pending} onClick={quitar} className="btn-danger btn-sm">
                Quitar
              </BotonAdmin>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
