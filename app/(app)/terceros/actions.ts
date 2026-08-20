"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TerceroTipo } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

export type TerceroFormState = { error: string } | null;

type TerceroInsert = Database["public"]["Tables"]["terceros"]["Insert"];

export async function guardarTercero(_prev: TerceroFormState, formData: FormData): Promise<TerceroFormState> {
  const editandoId = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "") as TerceroTipo;
  const nombre = String(formData.get("nombre") || "").trim();
  const apellido = String(formData.get("apellido") || "").trim() || null;
  const cedula_ruc = String(formData.get("cedula_ruc") || "").trim() || null;
  const tarea = String(formData.get("tarea") || "").trim() || null;
  const cuenta_id = String(formData.get("cuenta_id") || "") || null;

  if (!tipo || !nombre) {
    return { error: "Completa el grupo y el nombre." };
  }

  const campos: TerceroInsert = { tipo, nombre, apellido, cedula_ruc, tarea, cuenta_id };

  if (tipo === "empleado") {
    const sueldo = parseFloat(String(formData.get("sueldo") || ""));
    const horas = parseFloat(String(formData.get("horas") || "")) || 160;
    const precio_hora_raw = String(formData.get("precio_hora") || "").trim();
    if (isNaN(sueldo) || sueldo <= 0) {
      return { error: "Para 'Servicios prestados' el sueldo mensual es obligatorio." };
    }
    campos.sueldo = sueldo;
    campos.horas = horas;
    campos.precio_hora = precio_hora_raw ? parseFloat(precio_hora_raw) : sueldo / (horas || 160);
  } else {
    campos.sueldo = null;
    campos.horas = null;
    campos.precio_hora = null;
  }

  const supabase = await createClient();

  if (editandoId) {
    const { error } = await supabase.from("terceros").update(campos).eq("id", editandoId);
    if (error) return { error: "No se pudo actualizar el tercero." };
  } else {
    const { error } = await supabase.from("terceros").insert({ ...campos, activo: true });
    if (error) return { error: "No se pudo crear el tercero." };
  }

  revalidatePath("/terceros");
  redirect(`/terceros?grupo=${tipo}`);
}

export async function toggleActivoTercero(id: string, activo: boolean) {
  const supabase = await createClient();
  await supabase.from("terceros").update({ activo }).eq("id", id);
  revalidatePath("/terceros");
  revalidatePath(`/terceros/${id}`);
}
