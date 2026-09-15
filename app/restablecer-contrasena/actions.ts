"use server";

import { createClient } from "@/lib/supabase/server";

export type ActualizarContrasenaState = { error: string } | { ok: true } | null;

export async function actualizarContrasena(formData: FormData): Promise<ActualizarContrasenaState> {
  const password = String(formData.get("password") || "");
  const confirmar = String(formData.get("confirmar") || "");

  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (password !== confirmar) return { error: "Las dos contraseñas no coinciden." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Este enlace ya expiró o no es válido. Pide uno nuevo desde “¿Olvidaste tu contraseña?”." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo cambiar la contraseña. Intenta de nuevo." };

  return { ok: true };
}
