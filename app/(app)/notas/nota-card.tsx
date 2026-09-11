"use client";

import { useState, useTransition } from "react";
import { actualizarNota, eliminarNota, marcarRecordatorioVisto } from "./actions";
import { NOTA_COLORES, formatearRecordatorio, recordatorioVencido } from "@/lib/notas";
import { fmtDate, todayISO } from "@/lib/calculos";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { Nota, NotaColor } from "@/lib/types";

const COLOR_LABEL: Record<NotaColor, string> = {
  amarillo: "Amarillo",
  rosado: "Rosado",
  celeste: "Celeste",
  verde: "Verde",
  naranja: "Naranja",
};

// Pequeña variación de inclinación por nota, determinística según su id, para
// que el tablero se vea como notas de verdad pegadas una a una, no una
// cuadrícula perfecta.
function inclinacion(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return (hash % 5) - 2; // entre -2 y 2 grados
}

export default function NotaCard({ nota }: { nota: Nota }) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [color, setColor] = useState<NotaColor>(nota.color);
  const [conRecordatorio, setConRecordatorio] = useState(!!nota.recordatorio);

  const hoy = todayISO();
  const vencido = recordatorioVencido(nota.recordatorio, hoy);

  function guardar(formData: FormData) {
    formData.set("id", nota.id);
    startTransition(async () => {
      const resultado = await actualizarNota(null, formData);
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      setError("");
      setEditando(false);
    });
  }

  function eliminar() {
    if (!confirm(`¿Eliminar la nota "${nota.titulo}"? No se puede deshacer.`)) return;
    startTransition(() => eliminarNota(nota.id));
  }

  if (editando) {
    return (
      <div className={`nota nota-${color}`} style={{ transform: `rotate(${inclinacion(nota.id)}deg)` }}>
        <form action={guardar} className="flex flex-col gap-2 flex-1">
          <input name="titulo" type="text" required defaultValue={nota.titulo} className="finput !bg-white/60 font-bold" />
          <textarea name="contenido" rows={4} defaultValue={nota.contenido || ""} className="finput !bg-white/60 flex-1" />
          <div className="flex gap-1.5">
            {NOTA_COLORES.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" />
                <span
                  className={`nota-${c} block w-[20px] h-[20px] rounded-full border-2`}
                  style={{ borderColor: color === c ? "#33291a" : "transparent" }}
                  title={COLOR_LABEL[c]}
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-[11.5px] font-semibold cursor-pointer">
            <input
              type="checkbox"
              name="con_recordatorio"
              value="si"
              checked={conRecordatorio}
              onChange={(e) => setConRecordatorio(e.target.checked)}
            />
            Recordatorio
          </label>
          {conRecordatorio && (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  name="recordatorio_fecha"
                  type="date"
                  required={conRecordatorio}
                  defaultValue={nota.recordatorio?.fecha || hoy}
                  className="finput !bg-white/60 text-[11.5px]"
                />
                <input
                  name="recordatorio_hora"
                  type="time"
                  defaultValue={nota.recordatorio?.hora || ""}
                  className="finput !bg-white/60 text-[11.5px]"
                />
              </div>
              <select
                name="recordatorio_repetir"
                defaultValue={nota.recordatorio?.repetir || "ninguno"}
                className="finput !bg-white/60 text-[11.5px]"
              >
                <option value="ninguno">No se repite</option>
                <option value="diario">Todos los días</option>
                <option value="semanal">Cada semana</option>
                <option value="mensual">Cada mes</option>
              </select>
            </div>
          )}
          {error && <div className="text-[11px] font-semibold" style={{ color: "#8a1c1c" }}>{error}</div>}
          <div className="flex gap-1.5 mt-auto">
            <BotonAdmin type="submit" disabled={pending} className="btn-primary btn-sm">
              {pending ? "…" : "Guardar"}
            </BotonAdmin>
            <button type="button" onClick={() => setEditando(false)} className="btn-ghost btn-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`nota nota-${nota.color}` + (vencido ? " nota-vencida" : "")}
      style={{ transform: `rotate(${inclinacion(nota.id)}deg)` }}
    >
      <div className="font-extrabold text-[14px] leading-snug break-words">{nota.titulo}</div>
      {nota.contenido && <div className="text-[12.5px] leading-relaxed flex-1 whitespace-pre-wrap break-words">{nota.contenido}</div>}
      {nota.recordatorio && (
        <div className={"text-[11px] font-bold flex items-center gap-1 " + (vencido ? "" : "opacity-70")}>
          ⏰ {formatearRecordatorio(nota.recordatorio, fmtDate)}
          {vencido && " · ¡Vencido!"}
        </div>
      )}
      <div className="flex gap-1.5 mt-auto pt-1">
        {vencido && (
          <BotonAdmin
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => marcarRecordatorioVisto(nota.id))}
            className="btn-navy btn-sm !bg-black/70"
          >
            Visto
          </BotonAdmin>
        )}
        <button type="button" onClick={() => setEditando(true)} className="btn-ghost btn-sm !bg-black/10 hover:!bg-black/20">
          Editar
        </button>
        <BotonAdmin type="button" disabled={pending} onClick={eliminar} className="btn-danger btn-sm ml-auto">
          Eliminar
        </BotonAdmin>
      </div>
    </div>
  );
}
