"use client";

import { useTransition } from "react";
import { anularMovimiento } from "./actions";
import { BotonAdmin } from "@/lib/auth/boton-admin";

export default function AnularButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <BotonAdmin
      className="btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Anular este movimiento? Dejará de contar para saldos y reportes.")) return;
        startTransition(() => anularMovimiento(id));
      }}
    >
      {pending ? "…" : "Anular"}
    </BotonAdmin>
  );
}
