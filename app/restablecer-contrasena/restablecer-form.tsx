"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { actualizarContrasena, type ActualizarContrasenaState } from "./actions";

type EstadoLocal = { error: string } | null;

export default function RestablecerForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<EstadoLocal, FormData>(async (_prev, formData) => {
    const resultado: ActualizarContrasenaState = await actualizarContrasena(formData);
    if (resultado && "ok" in resultado) {
      router.push("/cuentas");
      return null;
    }
    return resultado;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <p className="text-[12.5px] text-muted -mt-1">Escribe tu nueva contraseña dos veces para confirmarla.</p>
      <div className="field">
        <label className="flabel flabel-req" htmlFor="password">
          Contraseña nueva
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          className="finput"
        />
      </div>
      <div className="field mb-1.5">
        <label className="flabel flabel-req" htmlFor="confirmar">
          Repetir contraseña nueva
        </label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          className="finput"
        />
      </div>
      {state?.error && <div className="alert-error">{state.error}</div>}
      <button type="submit" disabled={pending} className="btn-primary justify-center mt-1.5">
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
