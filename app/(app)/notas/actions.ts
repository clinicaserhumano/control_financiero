"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { todayISO } from "@/lib/calculos";
import { proximaFechaRecordatorio } from "@/lib/notas";
import type { NotaColor, NotaRecordatorio, NotaRepetir } from "@/lib/types";

export type NotaFormState = { error: string } | null;

function leerRecordatorio(formData: FormData): NotaRecordatorio | null {
  if (formData.get("con_recordatorio") !== "si") return null;
  const fecha = String(formData.get("recordatorio_fecha") || "");
  if (!fecha) return null;
  const hora = String(formData.get("recordatorio_hora") || "").trim() || null;
  const repetirRaw = String(formData.get("recordatorio_repetir") || "ninguno");
  const repetir: NotaRepetir = ["diario", "semanal", "mensual"].includes(repetirRaw) ? (repetirRaw as NotaRepetir) : "ninguno";
  return { fecha, hora, repetir };
}

function leerColor(formData: FormData): NotaColor {
  const raw = String(formData.get("color") || "amarillo");
  return (["amarillo", "rosado", "celeste", "verde", "naranja"] as const).includes(raw as NotaColor)
    ? (raw as NotaColor)
    : "amarillo";
}

export async function crearNota(_prev: NotaFormState, formData: FormData): Promise<NotaFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const titulo = String(formData.get("titulo") || "").trim();
  if (!titulo) return { error: "Ponle un título a la nota." };
  const contenido = String(formData.get("contenido") || "").trim() || null;
  const color = leerColor(formData);
  const recordatorio = leerRecordatorio(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("notas").insert({
    titulo,
    contenido,
    color,
    recordatorio,
    creado_por: user?.id ?? null,
  });
  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath("/notas");
  return null;
}

export async function actualizarNota(_prev: NotaFormState, formData: FormData): Promise<NotaFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const id = String(formData.get("id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  if (!id) return { error: "Nota no encontrada." };
  if (!titulo) return { error: "Ponle un título a la nota." };
  const contenido = String(formData.get("contenido") || "").trim() || null;
  const color = leerColor(formData);
  const recordatorio = leerRecordatorio(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("notas")
    .update({ titulo, contenido, color, recordatorio, actualizado_en: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar la nota." };

  revalidatePath("/notas");
  return null;
}

export async function eliminarNota(id: string) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  await supabase.from("notas").delete().eq("id", id);
  revalidatePath("/notas");
}

// Se usa desde la campanita: si el recordatorio no se repite, se apaga para
// siempre; si se repite, salta a su próxima fecha para que deje de avisar
// hoy pero vuelva a avisar en el siguiente ciclo.
export async function marcarRecordatorioVisto(id: string) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  const { data: nota } = await supabase.from("notas").select("recordatorio").eq("id", id).single();
  if (!nota?.recordatorio) return;

  const r = nota.recordatorio as NotaRecordatorio;
  const nuevoRecordatorio: NotaRecordatorio | null =
    r.repetir === "ninguno" ? null : { ...r, fecha: proximaFechaRecordatorio(r.fecha, r.repetir, todayISO()) };

  await supabase.from("notas").update({ recordatorio: nuevoRecordatorio }).eq("id", id);
  revalidatePath("/notas");
}
