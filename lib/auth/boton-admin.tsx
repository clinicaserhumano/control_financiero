"use client";

import Link from "next/link";
import { useEsAdmin } from "./role-context";

const MENSAJE = "No tienes los permisos necesarios para hacer esto (cuenta de solo lectura).";

// Envoltorio para botones de acción (guardar/eliminar/anular/etc.): si el
// usuario es 'visor' se ve igual pero atenuado y en gris, sigue siendo
// clicable (a propósito, no usa el atributo disabled) para poder avisar con
// un mensaje en vez de no reaccionar. Los campos de formulario en cambio sí
// deben quedar con disabled real (ver los propios formularios).
export function BotonAdmin({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const esAdmin = useEsAdmin();

  if (esAdmin) {
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className + " opacity-40 grayscale cursor-not-allowed"}
      onClick={() => alert(MENSAJE)}
      title={MENSAJE}
    >
      {children}
    </button>
  );
}

// Igual que BotonAdmin pero para acciones que hoy son <Link> hacia una
// pantalla de edición/confirmación: en modo visor no navega, solo avisa.
export function EnlaceAdmin({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  const esAdmin = useEsAdmin();

  if (esAdmin) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className + " opacity-40 grayscale cursor-not-allowed"}
      onClick={() => alert(MENSAJE)}
      title={MENSAJE}
    >
      {children}
    </button>
  );
}
