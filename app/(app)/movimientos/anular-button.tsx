"use client";

import { useTransition } from "react";
import { anularMovimiento } from "./actions";
import { useEsAdmin } from "@/lib/auth/role-context";

export default function AnularButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const esAdmin = useEsAdmin();

  if (!esAdmin) return null;

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
