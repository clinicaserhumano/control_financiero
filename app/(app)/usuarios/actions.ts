"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-admin";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarAuditoria } from "@/lib/auditoria";
import { USUARIO_PROTEGIDO, type Rol } from "@/lib/auth/roles";

export type UsuarioFormState = { error: string } | { ok: true } | null;

export async function crearUsuario(_prev: UsuarioFormState, formData: FormData): Promise<UsuarioFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const alias = String(formData.get("alias") || "").trim().toUpperCase();
  const rol: Rol = formData.get("rol") === "admin" ? "admin" : "visor";

  if (!email || !alias) return { error: "Completa el correo y el alias." };
  if (password.length < 6) return { error: "La clave debe tener al menos 6 caracteres." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    const yaExiste = error?.message?.toLowerCase().includes("already been registered");
    return { error: yaExiste ? "Ese correo ya tiene una cuenta." : "No se pudo crear el usuario." };
  }

  const { error: perfilError } = await admin.from("perfiles_usuario").insert({ id: data.user.id, email, alias, rol });
  if (perfilError) {
    // No dejar un usuario de Auth huérfano sin su perfil.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo guardar el perfil del usuario." };
  }

  await registrarAuditoria("usuario_creado", `Usuario creado: ${email} (${alias})`);

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function actualizarUsuario(_prev: UsuarioFormState, formData: FormData): Promise<UsuarioFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const userId = String(formData.get("userId") || "");
  const alias = String(formData.get("alias") || "").trim().toUpperCase();
  const rolNuevo: Rol = formData.get("rol") === "admin" ? "admin" : "visor";
  const password = String(formData.get("password") || "");

  if (!userId || !alias) return { error: "El alias no puede estar vacío." };
  if (password && password.length < 6) return { error: "La clave debe tener al menos 6 caracteres." };

  const perfilActual = await obtenerPerfilActual();
  if (perfilActual?.id === userId && rolNuevo !== perfilActual.rol) {
    return { error: "No puedes cambiar tu propio tipo de cuenta." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("perfiles_usuario").update({ alias, rol: rolNuevo }).eq("id", userId);
  if (error) return { error: "No se pudo actualizar el usuario." };

  if (password) {
    const { error: passError } = await admin.auth.admin.updateUserById(userId, { password });
    if (passError) return { error: "El alias/tipo de cuenta se guardaron, pero no se pudo cambiar la clave." };
  }

  await registrarAuditoria("usuario_editado", `Usuario editado: ${alias}${password ? " (con cambio de clave)" : ""}`);

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function eliminarUsuario(_prev: UsuarioFormState, formData: FormData): Promise<UsuarioFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  if (!userId) return { error: "Usuario no encontrado." };
  if (!password) return { error: "Ingresa tu contraseña para confirmar." };

  const perfilActual = await obtenerPerfilActual();
  if (!perfilActual) return { error: "No se pudo verificar tu sesión." };
  if (perfilActual.id === userId) return { error: "No puedes borrar tu propia cuenta." };

  const admin = createAdminClient();
  const { data: objetivo } = await admin.from("perfiles_usuario").select("email").eq("id", userId).single();
  if (!objetivo) return { error: "Usuario no encontrado." };
  if (objetivo.email.toLowerCase() === USUARIO_PROTEGIDO) {
    return { error: "Esta cuenta no se puede borrar." };
  }

  // Verifica la contraseña de quien confirma el borrado con un cliente
  // aparte (no toca la sesión/cookies reales de quien tiene la sesión
  // abierta) — si el login falla, la contraseña escrita está mal.
  const verificador = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: authError } = await verificador.auth.signInWithPassword({ email: perfilActual.email, password });
  if (authError) return { error: "Contraseña incorrecta." };

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "No se pudo borrar el usuario." };

  await registrarAuditoria("usuario_borrado", `Usuario borrado: ${objetivo.email}`);

  revalidatePath("/usuarios");
  return { ok: true };
}
