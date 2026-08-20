"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { guardarTercero, type TerceroFormState } from "./actions";
import { TERCERO_TABS, type TerceroGrupo } from "@/lib/terceros";
import type { Cuenta, Tercero } from "@/lib/types";

export default function TerceroForm({
  grupoActivo,
  cuentas,
  terceroEditando,
}: {
  grupoActivo: TerceroGrupo;
  cuentas: Cuenta[];
  terceroEditando: Tercero | null;
}) {
  const [state, formAction, pending] = useActionState<TerceroFormState, FormData>(guardarTercero, null);
  const [tipo, setTipo] = useState<string>(terceroEditando?.tipo || grupoActivo);
  const esServicios = tipo === "empleado";
  const [sueldo, setSueldo] = useState(terceroEditando?.sueldo?.toString() || "");
  const [horas, setHoras] = useState(terceroEditando?.horas?.toString() || "160");
  const [precioHora, setPrecioHora] = useState(terceroEditando?.precio_hora?.toString() || "");

  function recalcularPrecio(nuevoSueldo: string, nuevasHoras: string) {
    const s = parseFloat(nuevoSueldo);
    const h = parseFloat(nuevasHoras);
    if (!isNaN(s) && !isNaN(h) && h > 0) setPrecioHora((s / h).toFixed(4));
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>{terceroEditando ? "Editar tercero" : "Nuevo tercero"}</h2>
      </div>
      <div className="card-b">
        <form action={formAction} className="flex flex-col">
          {terceroEditando && <input type="hidden" name="id" value={terceroEditando.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="flabel flabel-req" htmlFor="nombre">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={terceroEditando?.nombre}
                className="finput"
              />
            </div>
            <div className="field">
              <label className="flabel" htmlFor="apellido">
                Apellido
              </label>
              <input id="apellido" name="apellido" type="text" defaultValue={terceroEditando?.apellido || ""} className="finput" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="flabel" htmlFor="cedula_ruc">
                Cédula / RUC
              </label>
              <input
                id="cedula_ruc"
                name="cedula_ruc"
                type="text"
                placeholder="Opcional"
                defaultValue={terceroEditando?.cedula_ruc || ""}
                className="finput"
              />
            </div>
            <div className="field">
              <label className="flabel" htmlFor="tarea">
                Tarea / cargo
              </label>
              <input
                id="tarea"
                name="tarea"
                type="text"
                placeholder="Opcional"
                defaultValue={terceroEditando?.tarea || ""}
                className="finput"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="flabel flabel-req" htmlFor="tipo">
                Grupo
              </label>
              <select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="finput">
                {TERCERO_TABS.map((t) => (
                  <option key={t.grupo} value={t.grupo}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="flabel" htmlFor="cuenta_id">
                Cuenta que paga (opcional)
              </label>
              <select id="cuenta_id" name="cuenta_id" defaultValue={terceroEditando?.cuenta_id || ""} className="finput">
                <option value="">— Ninguna —</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa} — {c.banco} {c.numero}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {esServicios && (
            <div className="grid grid-cols-3 gap-3">
              <div className="field">
                <label className="flabel flabel-req" htmlFor="sueldo">
                  Sueldo mensual (USD)
                </label>
                <input
                  id="sueldo"
                  name="sueldo"
                  type="number"
                  step="0.01"
                  min="0"
                  required={esServicios}
                  value={sueldo}
                  onChange={(e) => {
                    setSueldo(e.target.value);
                    recalcularPrecio(e.target.value, horas);
                  }}
                  className="finput"
                />
              </div>
              <div className="field">
                <label className="flabel" htmlFor="horas">
                  Horas al mes
                </label>
                <input
                  id="horas"
                  name="horas"
                  type="number"
                  step="1"
                  value={horas}
                  onChange={(e) => {
                    setHoras(e.target.value);
                    recalcularPrecio(sueldo, e.target.value);
                  }}
                  className="finput"
                />
              </div>
              <div className="field">
                <label className="flabel" htmlFor="precio_hora">
                  Precio por hora
                </label>
                <input
                  id="precio_hora"
                  name="precio_hora"
                  type="number"
                  step="0.0001"
                  value={precioHora}
                  onChange={(e) => setPrecioHora(e.target.value)}
                  className="finput"
                />
                <div className="fhint">Se calcula solo; puedes ajustarlo</div>
              </div>
            </div>
          )}

          {state?.error && (
            <div className="text-[13px] font-semibold text-danger bg-[#fbeaea] border border-[#f3d3d3] rounded-lg px-3 py-2 mb-3.5">
              {state.error}
            </div>
          )}
          <div className="flex gap-2.5 flex-wrap mt-1.5">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando…" : terceroEditando ? "Guardar cambios" : "Guardar tercero"}
            </button>
            {terceroEditando && (
              <Link href={`/terceros?grupo=${grupoActivo}`} className="btn-ghost">
                Cancelar edición
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
