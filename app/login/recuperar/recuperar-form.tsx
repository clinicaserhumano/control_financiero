"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { solicitarRecuperacion, type RecuperarState } from "../actions";

export default function RecuperarForm() {
  const [enviado, setEnviado] = useState(false);
  const [state, formAction, pending] = useActionState<RecuperarState, FormData>(async (_prev, formData) => {
    formData.set("origin", window.location.origin);
    const resultado = await solicitarRecuperacion(formData);
    if (resultado && "ok" in resultado) setEnviado(true);
    return resultado;
  }, null);

  if (enviado) {
    return (
      <div className="flex flex-col gap-3.5">
        <p className="text-[13.5px] text-ink leading-relaxed">
          Si ese correo está registrado, te enviamos un enlace para crear una contraseña nueva. Revisa tu bandeja de
          entrada — y la carpeta de spam, por si acaso.
        </p>
        <Link href="/login" className="btn-ghost btn-sm justify-center">
          ← Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <p className="text-[12.5px] text-muted -mt-1">
        Escribe el correo con el que inicias sesión y te enviamos un enlace para crear una contraseña nueva.
      </p>
      <div className="field mb-1.5">
        <label className="flabel flabel-req" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="usuario@serhumano.ec"
          className="finput"
        />
      </div>
      {state && "error" in state && <div className="alert-error">{state.error}</div>}
      <button type="submit" disabled={pending} className="btn-primary justify-center mt-1.5">
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
      <Link href="/login" className="text-[12px] text-center text-muted underline">
        ← Volver a iniciar sesión
      </Link>
    </form>
  );
}
