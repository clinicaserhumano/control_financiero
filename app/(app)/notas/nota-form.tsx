"use client";

import { useState, useTransition } from "react";
import { crearNota } from "./actions";
import { NOTA_COLORES } from "@/lib/notas";
import { todayISO } from "@/lib/calculos";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { NotaColor } from "@/lib/types";

const COLOR_LABEL: Record<NotaColor, string> = {
  amarillo: "Amarillo",
  rosado: "Rosado",
  celeste: "Celeste",
  verde: "Verde",
  naranja: "Naranja",
};

export default function NotaForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [color, setColor] = useState<NotaColor>("amarillo");
  const [conRecordatorio, setConRecordatorio] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function enviar(formData: FormData) {
    startTransition(async () => {
      const resultado = await crearNota(null, formData);
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      setError("");
      setColor("amarillo");
      setConRecordatorio(false);
      setFormKey((k) => k + 1);
    });
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>Nueva nota</h2>
      </div>
      <div className="card-b">
        <form key={formKey} action={enviar} className="flex flex-col gap-3">
          <div className="field mb-0">
            <label className="flabel flabel-req">Título</label>
            <input name="titulo" type="text" required placeholder="Ej: Llamar al proveedor" className="finput" />
          </div>
          <div className="field mb-0">
            <label className="flabel">Contenido (opcional)</label>
            <textarea name="contenido" rows={3} placeholder="Detalles de la nota…" className="finput" />
          </div>
          <div className="field mb-0">
            <label className="flabel">Color</label>
            <div className="flex gap-2">
              {NOTA_COLORES.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    checked={color === c}
                    onChange={() => setColor(c)}
                    className="sr-only"
                  />
                  <span
                    className={`nota-${c} block w-[26px] h-[26px] rounded-full border-2`}
                    style={{ borderColor: color === c ? "var(--color-ink)" : "transparent" }}
                    title={COLOR_LABEL[c]}
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer">
            <input
              type="checkbox"
              name="con_recordatorio"
              value="si"
              checked={conRecordatorio}
              onChange={(e) => setConRecordatorio(e.target.checked)}
            />
            Agregar recordatorio
          </label>

          {conRecordatorio && (
            <div className="rounded-[8px] border border-border p-3 flex flex-col gap-2.5 bg-[var(--color-surface-2)]">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="field mb-0">
                  <label className="flabel flabel-req">Fecha</label>
                  <input name="recordatorio_fecha" type="date" required={conRecordatorio} defaultValue={todayISO()} className="finput" />
                </div>
                <div className="field mb-0">
                  <label className="flabel">Hora (opcional)</label>
                  <input name="recordatorio_hora" type="time" className="finput" />
                </div>
              </div>
              <div className="field mb-0">
                <label className="flabel">Repetir</label>
                <select name="recordatorio_repetir" defaultValue="ninguno" className="finput">
                  <option value="ninguno">No se repite</option>
                  <option value="diario">Todos los días</option>
                  <option value="semanal">Cada semana</option>
                  <option value="mensual">Cada mes</option>
                </select>
              </div>
              <div className="fhint mt-0">
                El aviso aparece en la campanita 🔔 apenas alguien abra el sistema ese día — no es una notificación
                push a una hora exacta.
              </div>
            </div>
          )}

          {error && <div className="alert-error">{error}</div>}

          <BotonAdmin type="submit" disabled={pending} className="btn-primary self-start">
            {pending ? "Guardando…" : "Guardar nota"}
          </BotonAdmin>
        </form>
      </div>
    </div>
  );
}
