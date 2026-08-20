"use client";

import { useTransition } from "react";
import { toggleActivoTercero } from "./actions";
import { useEsAdmin } from "@/lib/auth/role-context";

export default function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();
  const esAdmin = useEsAdmin();

  if (!esAdmin) {
    return <span className={"pill " + (activo ? "" : "!bg-[#fbeaea] !text-danger")}>{activo ? "Activo" : "Inactivo"}</span>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleActivoTercero(id, !activo))}
      className={"btn-sm " + (activo ? "btn-ghost" : "btn-gold")}
      title={activo ? "Marcar como inactivo" : "Marcar como activo"}
    >
      {pending ? "…" : activo ? "Activo" : "Inactivo"}
    </button>
  );
}
