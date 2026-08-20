"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearUsuario, type UsuarioFormState } from "./actions";

export default function FormularioCrearUsuario() {
  const [state, formAction, pending] = useActionState<UsuarioFormState, FormData>(crearUsuario, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap gap-3 items-end">
      <div className="field mb-0" style={{ minWidth: 210 }}>
        <label className="flabel flabel-req" htmlFor="email">
          Correo
        </label>
        <input id="email" name="email" type="email" required className="finput" placeholder="nombre@correo.com" />
      </div>
      <div className="field mb-0" style={{ minWidth: 140 }}>
        <label className="flabel flabel-req" htmlFor="alias">
          Alias
        </label>
        <input id="alias" name="alias" type="text" required className="finput" placeholder="JORGE" />
      </div>
      <div className="field mb-0" style={{ minWidth: 160 }}>
        <label className="flabel flabel-req" htmlFor="password">
          Clave
        </label>
        <input id="password" name="password" type="text" required minLength={6} className="finput" placeholder="Mínimo 6 caracteres" />
      </div>
      <div className="field mb-0" style={{ minWidth: 160 }}>
        <label className="flabel" htmlFor="rol">
          Tipo de cuenta
        </label>
        <select id="rol" name="rol" defaultValue="visor" className="finput">
          <option value="visor">Solo lectura</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Creando…" : "Crear usuario"}
      </button>
      {state && "error" in state && <div className="alert-error basis-full">{state.error}</div>}
    </form>
  );
}
