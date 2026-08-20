"use client";

import { useActionState } from "react";
import Link from "next/link";
import { guardarCuenta, type CuentaFormState } from "./actions";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { Cuenta } from "@/lib/types";

export default function CuentaForm({ cuentaEditando }: { cuentaEditando: Cuenta | null }) {
  const [state, formAction, pending] = useActionState<CuentaFormState, FormData>(guardarCuenta, null);
  const esAdmin = useEsAdmin();

  return (
    <div className="card">
      <div className="card-h">
        <h2>{cuentaEditando ? "Editar cuenta" : "Nueva cuenta"}</h2>
      </div>
      <div className="card-b">
        <form action={formAction} className="flex flex-col">
          {cuentaEditando && <input type="hidden" name="id" value={cuentaEditando.id} />}
          <fieldset disabled={!esAdmin} className="contents">
            <div className="field">
              <label className="flabel flabel-req" htmlFor="empresa">
                Empresa / Titular
              </label>
              <input
                id="empresa"
                name="empresa"
                type="text"
                required
                defaultValue={cuentaEditando?.empresa}
                placeholder="NADIA DONADONIBUS"
                className="finput"
              />
            </div>
            <div className="field">
              <label className="flabel flabel-req" htmlFor="ruc">
                RUC
              </label>
              <input
                id="ruc"
                name="ruc"
                type="text"
                required
                defaultValue={cuentaEditando?.ruc}
                placeholder="0927805929001"
                className="finput"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="flabel flabel-req" htmlFor="banco">
                  Banco
                </label>
                <input
                  id="banco"
                  name="banco"
                  type="text"
                  required
                  defaultValue={cuentaEditando?.banco}
                  placeholder="BANCO GUAYAQUIL"
                  className="finput"
                />
              </div>
              <div className="field">
                <label className="flabel" htmlFor="tipo">
                  Tipo de cuenta
                </label>
                <select id="tipo" name="tipo" defaultValue={cuentaEditando?.tipo || "CTA-CTE"} className="finput">
                  <option>CTA-CTE</option>
                  <option>AHORROS</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="flabel flabel-req" htmlFor="numero">
                N° de cuenta
              </label>
              <input
                id="numero"
                name="numero"
                type="text"
                required
                defaultValue={cuentaEditando?.numero}
                placeholder="005020824-9"
                className="finput"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="flabel" htmlFor="elaborado">
                  Elaborado por
                </label>
                <input
                  id="elaborado"
                  name="elaborado"
                  type="text"
                  defaultValue={cuentaEditando?.elaborado || ""}
                  placeholder="Contabilidad"
                  className="finput"
                />
              </div>
              <div className="field">
                <label className="flabel" htmlFor="aprobado">
                  Revisado / aprobado por
                </label>
                <input
                  id="aprobado"
                  name="aprobado"
                  type="text"
                  defaultValue={cuentaEditando?.aprobado || ""}
                  placeholder="Tnlgo. Fabián Ochoa"
                  className="finput"
                />
              </div>
            </div>
          </fieldset>
          {state?.error && <div className="alert-error mb-3.5">{state.error}</div>}
          <div className="flex gap-2.5 flex-wrap mt-1.5">
            <BotonAdmin type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando…" : cuentaEditando ? "Guardar cambios" : "Guardar cuenta"}
            </BotonAdmin>
            {cuentaEditando && (
              <Link href="/cuentas" className="btn-ghost">
                Cancelar edición
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
