"use client";

import { useTransition } from "react";
import { eliminarCuenta } from "./actions";

export default function EliminarCuentaButton({ id, empresa }: { id: string; empresa: string }) {
  const [pending, startTransition] = useTransition();

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
