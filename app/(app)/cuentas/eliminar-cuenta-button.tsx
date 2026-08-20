"use client";

import { useTransition } from "react";
import { eliminarCuenta } from "./actions";
import { BotonAdmin } from "@/lib/auth/boton-admin";

export default function EliminarCuentaButton({ id, empresa }: { id: string; empresa: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <BotonAdmin
      className="btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Eliminar la cuenta de ${empresa}? Esto no elimina sus movimientos ya registrados.`)) return;
        startTransition(() => eliminarCuenta(id));
      }}
    >
      {pending ? "…" : "Eliminar"}
    </BotonAdmin>
  );
}
