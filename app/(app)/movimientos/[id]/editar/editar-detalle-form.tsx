"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { editarDetalleMovimiento, type EditarDetalleState } from "../../actions";
import { money, fmtDate } from "@/lib/calculos";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { Cuenta, CampoExtra } from "@/lib/types";

type Props = {
  movimiento: {
    id: string;
    fecha: string;
    monto: number;
    concepto: string | null;
    observaciones: string | null;
    referencia: Record<string, string>;
  };
  cuenta: Cuenta | null;
  quien: string | null;
  camposExtra: CampoExtra[];
  redirectTo: string;
};

type EstadoLocal = { error: string } | null;

export default function EditarDetalleForm({ movimiento, cuenta, quien, camposExtra, redirectTo }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<EstadoLocal, FormData>(async (_prev, formData) => {
    const resultado: EditarDetalleState = await editarDetalleMovimiento(null, formData);
    if (resultado && "ok" in resultado) {
      router.push(resultado.redirectTo);
      return null;
    }
    return resultado;
  }, null);

  return (
    <div className="card">
      <div className="card-h">
        <h2>Editar detalle del movimiento</h2>
      </div>
      <div className="card-b">
        <div className="letras-box mb-3.5">
          Solo se puede corregir el número de cheque/comprobante, el concepto y las observaciones — el{" "}
          <b>monto, la fecha, la cuenta y a quién corresponde no se pueden cambiar aquí</b>. Si alguno de esos
          datos está mal, no lo edites: anula este movimiento y crea uno nuevo con el dato correcto.
        </div>

        <form action={formAction} className="flex flex-col">
          <input type="hidden" name="movimiento_id" value={movimiento.id} />
          <input type="hidden" name="redirect_to" value={redirectTo} />

          <fieldset disabled className="contents">
            {quien && (
              <div className="field">
                <label className="flabel">A favor de / recibido de</label>
                <input type="text" value={quien} readOnly className="finput opacity-60" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="flabel">Fecha</label>
                <input type="text" value={fmtDate(movimiento.fecha)} readOnly className="finput opacity-60" />
              </div>
              <div className="field">
                <label className="flabel">Valor (no editable)</label>
                <input type="text" value={money(movimiento.monto)} readOnly className="finput opacity-60 font-bold" />
              </div>
            </div>
            {cuenta && (
              <div className="field">
                <label className="flabel">Cuenta</label>
                <input type="text" value={`${cuenta.empresa} — ${cuenta.banco} ${cuenta.numero}`} readOnly className="finput opacity-60" />
              </div>
            )}
          </fieldset>
          <div className="fhint -mt-2 mb-3.5">
            Estos campos quedan bloqueados a propósito — cambiar el valor de algo ya pagado, sin dejar rastro, abriría la puerta a alterar el dinero después del hecho.
          </div>

          <fieldset className="contents">
            {camposExtra.map((c) => (
              <div className="field" key={c.clave}>
                <label className={"flabel" + (c.requerido ? " flabel-req" : "")} htmlFor={`campo__${c.clave}`}>
                  {c.etiqueta}
                </label>
                <input
                  id={`campo__${c.clave}`}
                  name={`campo__${c.clave}`}
                  type={c.tipo === "number" ? "number" : c.tipo === "date" ? "date" : "text"}
                  required={c.requerido}
                  defaultValue={movimiento.referencia[c.clave] || ""}
                  className="finput"
                />
              </div>
            ))}

            <div className="field">
              <label className="flabel" htmlFor="concepto">
                Concepto
              </label>
              <input id="concepto" name="concepto" type="text" defaultValue={movimiento.concepto || ""} className="finput" />
            </div>

            <div className="field">
              <label className="flabel" htmlFor="observaciones">
                Observaciones
              </label>
              <input
                id="observaciones"
                name="observaciones"
                type="text"
                defaultValue={movimiento.observaciones || ""}
                className="finput"
              />
            </div>
          </fieldset>

          {state?.error && <div className="alert-error mb-3.5">{state.error}</div>}

          <div className="flex gap-2.5 flex-wrap mt-1.5">
            <BotonAdmin type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando…" : "Guardar cambios"}
            </BotonAdmin>
          </div>
        </form>
      </div>
    </div>
  );
}
