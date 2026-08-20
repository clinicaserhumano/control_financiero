"use client";

import { useTransition } from "react";
import { anularMovimiento } from "./actions";

export default function AnularButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Anular este movimiento? Dejará de contar para saldos y reportes.")) return;
        startTransition(() => anularMovimiento(id));
      }}
    >
      {pending ? "…" : "Anular"}
    </button>
  );
}
