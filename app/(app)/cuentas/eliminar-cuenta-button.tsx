"use client";

import { useTransition } from "react";
import { eliminarCuenta } from "./actions";
import { useEsAdmin } from "@/lib/auth/role-context";

export default function EliminarCuentaButton({ id, empresa }: { id: string; empresa: string }) {
  const [pending, startTransition] = useTransition();
  const esAdmin = useEsAdmin();

  if (!esAdmin) return null;

  return (
    <button
      type="button"
      className="btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Eliminar la cuenta de ${empresa}? Esto no elimina sus movimientos ya registrados.`)) return;
        startTransition(() => eliminarCuenta(id));
      }}
    >
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
