"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/cuentas");

  if (!email || !password) {
    return { error: "Ingresa correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(next.startsWith("/") ? next : "/cuentas");
}

export type RecuperarState = { error: string } | { ok: true } | null;

// Por seguridad no se revela si el correo existe o no en el sistema — el
// mensaje es siempre el mismo, exista o no la cuenta (evita que alguien use
// este formulario para averiguar qué correos están registrados).
export async function solicitarRecuperacion(formData: FormData): Promise<RecuperarState> {
  const email = String(formData.get("email") || "").trim();
  const origin = String(formData.get("origin") || "").trim();

  if (!email) return { error: "Ingresa tu correo." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/confirmar?next=/restablecer-contrasena` : undefined,
  });

  // El límite de envíos (correo gratuito de Supabase, sin SMTP propio) es
  // seguro de mostrar tal cual — no revela si ese correo existe o no, así
  // que no rompe la regla de arriba. Cualquier otro error sí se esconde.
  if (error?.code === "over_email_send_rate_limit") {
    return { error: "Se enviaron muchos correos seguidos y Supabase puso un límite temporal — espera unos minutos y vuelve a intentar." };
  }

  return { ok: true };
}
