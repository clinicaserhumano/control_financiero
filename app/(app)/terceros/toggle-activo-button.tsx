"use client";

import { useTransition } from "react";
import { toggleActivoTercero } from "./actions";

export default function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

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
