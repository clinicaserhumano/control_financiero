"use client";

import { useTransition } from "react";
import { toggleActivoTercero } from "./actions";
import { BotonAdmin } from "@/lib/auth/boton-admin";

export default function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <BotonAdmin
      disabled={pending}
      onClick={() => startTransition(() => toggleActivoTercero(id, !activo))}
      className={"btn-sm " + (activo ? "btn-ghost" : "btn-gold")}
      title={activo ? "Marcar como inactivo" : "Marcar como activo"}
    >
      {pending ? "…" : activo ? "Activo" : "Inactivo"}
    </BotonAdmin>
  );
}
