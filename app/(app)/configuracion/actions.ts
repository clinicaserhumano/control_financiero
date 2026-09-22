"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { esHexValido } from "@/lib/color";
import { esTemaOscuroValido } from "@/lib/temas-oscuros";

export type ConfiguracionState = { error: string } | { ok: true } | null;

export async function actualizarConfiguracion(_prev: ConfiguracionState, formData: FormData): Promise<ConfiguracionState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const nombreEmpresa = String(formData.get("nombre_empresa") || "").trim();
  const colorPrimario = String(formData.get("color_primario") || "").trim();
  const colorHeader = String(formData.get("color_header") || "").trim();
  const temaOscuro = String(formData.get("tema_oscuro") || "").trim();

  if (!nombreEmpresa) return { error: "Ingresa el nombre de la razón social." };
  if (!esHexValido(colorPrimario)) return { error: "El color principal no es un código hexadecimal válido (ej: #fc6b12)." };
  if (!esHexValido(colorHeader)) return { error: "El color del encabezado no es un código hexadecimal válido (ej: #2b2420)." };
  if (!esTemaOscuroValido(temaOscuro)) return { error: "Selecciona un tema oscuro válido." };

  const supabase = await createClient();
  const { data: actual } = await supabase.from("configuracion").select("id,logo_url").limit(1).maybeSingle();
  if (!actual) return { error: "No se encontró la fila de configuración — corre la migración en Supabase primero." };

  let logoUrl = actual.logo_url;
  const archivo = formData.get("logo") as File | null;
  if (archivo && archivo.size > 0) {
    if (archivo.size > 2 * 1024 * 1024) return { error: "El logo no puede pesar más de 2MB." };
    if (!archivo.type.startsWith("image/")) return { error: "El logo debe ser un archivo de imagen." };

    const ext = (archivo.name.split(".").pop() || "png").toLowerCase();
    const ruta = `logo.${ext}`;
    const { error: errorSubida } = await supabase.storage
      .from("logos")
      .upload(ruta, archivo, { upsert: true, contentType: archivo.type });
    if (errorSubida) return { error: "No se pudo subir el logo." };

    const { data: publica } = supabase.storage.from("logos").getPublicUrl(ruta);
    // ?v= para que el navegador no siga mostrando el logo anterior en caché
    // cuando se sube uno nuevo con el mismo nombre de archivo.
    logoUrl = `${publica.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase
    .from("configuracion")
    .update({
      nombre_empresa: nombreEmpresa,
      color_primario: colorPrimario,
      color_header: colorHeader,
      tema_oscuro: temaOscuro,
      logo_url: logoUrl,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", actual.id);
  if (error) return { error: "No se pudo guardar la configuración." };

  // Revalida todo (el logo/nombre/colores aparecen en cada página).
  revalidatePath("/", "layout");
  return { ok: true };
}
