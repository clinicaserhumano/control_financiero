"use client";

import { useActionState } from "react";
import { login } from "./actions";

type State = { error: string } | null;

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    const result = await login(formData);
    return result ?? null;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <input type="hidden" name="next" value={next} />
      <div className="field">
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
      <div className="field mb-1.5">
        <label className="flabel flabel-req" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="finput"
        />
      </div>
      {state?.error && (
        <div className="alert-error">
          {state.error}
        </div>
      )}
      <button type="submit" disabled={pending} className="btn-primary justify-center mt-1.5">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
