"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { guardarTercero, type TerceroFormState } from "./actions";
import { TERCERO_TABS, type TerceroGrupo } from "@/lib/terceros";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { Cuenta, HorarioDia, Tercero } from "@/lib/types";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

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
  const tieneHorario = tipo === "empleado" || tipo === "afiliado";
  const [sueldo, setSueldo] = useState(terceroEditando?.sueldo?.toString() || "");
  const [horas, setHoras] = useState(terceroEditando?.horas?.toString() || "160");
  const [precioHora, setPrecioHora] = useState(terceroEditando?.precio_hora?.toString() || "");
  const [horario, setHorario] = useState<HorarioDia[]>(() =>
    DIAS_SEMANA.map((dia) => terceroEditando?.horario?.find((h) => h.dia === dia) ?? { dia, entrada: "", salida: "" })
  );
  const [diasMarcados, setDiasMarcados] = useState<boolean[]>(() => horario.map((h) => !!(h.entrada || h.salida)));
  const esAdmin = useEsAdmin();

  function marcarDia(i: number, marcado: boolean) {
    setDiasMarcados((prev) => prev.map((m, j) => (j === i ? marcado : m)));
    if (!marcado) {
      setHorario((prev) => prev.map((h, j) => (j === i ? { ...h, entrada: "", salida: "" } : h)));
    }
  }

  function recalcularPrecio(nuevoSueldo: string, nuevasHoras: string) {
    const s = parseFloat(nuevoSueldo);
    const h = parseFloat(nuevasHoras);
    if (!isNaN(s) && !isNaN(h) && h > 0) setPrecioHora((s / h).toFixed(4));
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>{terceroEditando ? "Editar persona" : "Nueva persona"}</h2>
      </div>
      <div className="card-b">
        <form action={formAction} className="flex flex-col">
          {terceroEditando && <input type="hidden" name="id" value={terceroEditando.id} />}
          <fieldset disabled={!esAdmin} className="contents">
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

          {tieneHorario && (
            <div className="field">
              <label className="flabel">Horario habitual (opcional)</label>
              <input type="hidden" name="horario" value={JSON.stringify(horario)} />
              <div className="flex flex-col gap-1.5">
                {horario.map((h, i) => (
                  <div key={h.dia} className="grid grid-cols-[20px_84px_1fr_1fr] gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={diasMarcados[i]}
                      onChange={(e) => marcarDia(i, e.target.checked)}
                      title={`Se trabaja el ${h.dia}`}
                    />
                    <span className={"text-[12.5px] font-semibold " + (diasMarcados[i] ? "" : "text-muted")}>{h.dia}</span>
                    <input
                      type="time"
                      disabled={!diasMarcados[i]}
                      value={h.entrada}
                      onChange={(e) => setHorario((prev) => prev.map((x, j) => (j === i ? { ...x, entrada: e.target.value } : x)))}
                      className="finput disabled:opacity-40"
                    />
                    <input
                      type="time"
                      disabled={!diasMarcados[i]}
                      value={h.salida}
                      onChange={(e) => setHorario((prev) => prev.map((x, j) => (j === i ? { ...x, salida: e.target.value } : x)))}
                      className="finput disabled:opacity-40"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={!horario[0]?.entrada || !horario[0]?.salida}
                onClick={() => {
                  const lunes = horario[0];
                  setHorario((prev) => prev.map((h, i) => (i === 0 ? h : { ...h, entrada: lunes.entrada, salida: lunes.salida })));
                  setDiasMarcados(horario.map(() => true));
                }}
                className="btn-ghost btn-sm self-start mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Repetir horario del Lunes en todos los días
              </button>
              <div className="fhint">
                Marca los días que se trabajan (de Lunes a Domingo) y llena su hora de entrada y salida. Los días sin
                marcar quedan sin horario.
              </div>
            </div>
          )}
          </fieldset>

          {state?.error && (
            <div className="alert-error mb-3.5">
              {state.error}
            </div>
          )}
          <div className="flex gap-2.5 flex-wrap mt-1.5">
            <BotonAdmin type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando…" : terceroEditando ? "Guardar cambios" : "Guardar persona"}
            </BotonAdmin>
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
