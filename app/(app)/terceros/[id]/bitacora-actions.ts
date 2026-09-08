"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { calcularHorasSemana, todayISO } from "@/lib/calculos";
import type { DiaSemana } from "@/lib/types";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

function semanaVacia(): DiaSemana[] {
  return DIAS_SEMANA.map((dia) => ({ dia, fecha: "", entrada: "", salida: "", almuerzo: "", nota: "" }));
}

export async function agregarSemana(terceroId: string) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  await supabase.from("semanas").insert({ tercero_id: terceroId, etiqueta: "", dias: semanaVacia() });
  revalidatePath(`/terceros/${terceroId}`);
}

export async function eliminarSemana(semanaId: string, terceroId: string) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  // Solo se permite borrar una semana que todavía no se cargó como cargo
  // (protege el registro financiero una vez que existe un movimiento ligado).
  await supabase.from("semanas").delete().eq("id", semanaId).is("movimiento_id", null);
  revalidatePath(`/terceros/${terceroId}`);
}

export async function guardarDiasSemana(semanaId: string, terceroId: string, etiqueta: string, dias: DiaSemana[]) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  await supabase.from("semanas").update({ etiqueta, dias }).eq("id", semanaId);
  revalidatePath(`/terceros/${terceroId}`);
}

export type CargarSemanaState = { error: string } | null;

export async function cargarSemana(_prev: CargarSemanaState, formData: FormData): Promise<CargarSemanaState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const semanaId = String(formData.get("semana_id") || "");
  const terceroId = String(formData.get("tercero_id") || "");
  const etiqueta = String(formData.get("etiqueta") || "").trim();
  const fecha = String(formData.get("fecha") || todayISO());
  let dias: DiaSemana[];
  try {
    dias = JSON.parse(String(formData.get("dias") || "[]"));
  } catch {
    return { error: "No se pudo leer la asistencia de la semana." };
  }

  const supabase = await createClient();

  const [{ data: semana }, { data: tercero }] = await Promise.all([
    supabase.from("semanas").select("movimiento_id").eq("id", semanaId).single(),
    supabase.from("terceros").select("precio_hora").eq("id", terceroId).single(),
  ]);
  if (!semana || !tercero) return { error: "No se encontró la semana o el tercero." };

  const { valor } = calcularHorasSemana(dias, tercero.precio_hora || 0);
  if (valor <= 0) return { error: "La semana no tiene horas registradas." };

  const concepto = etiqueta || "Servicios prestados";

  // Guarda siempre la asistencia editada, se pueda o no cargar el cargo.
  await supabase.from("semanas").update({ etiqueta, dias }).eq("id", semanaId);

  if (semana.movimiento_id) {
    const { data: movimiento } = await supabase
      .from("movimientos_financieros")
      .select("estado")
      .eq("id", semana.movimiento_id)
      .single();
    if (!movimiento) return { error: "El cargo original ya no existe." };
    if (movimiento.estado !== "pendiente") {
      return { error: "Esta semana ya fue pagada o anulada; no se puede recargar." };
    }
    const { error } = await supabase
      .from("movimientos_financieros")
      .update({ monto: valor, concepto, fecha })
      .eq("id", semana.movimiento_id);
    if (error) return { error: "No se pudo actualizar el cargo." };
  } else {
    const { data: nuevo, error } = await supabase
      .from("movimientos_financieros")
      .insert({
        fecha,
        tipo: "egreso",
        cuenta_id: null,
        tercero_id: terceroId,
        monto: valor,
        estado: "pendiente",
        concepto,
        origen: "nomina",
        vinculo_id: semanaId,
      })
      .select("id")
      .single();
    if (error || !nuevo) return { error: "No se pudo crear el cargo." };
    const { error: errorLink } = await supabase.from("semanas").update({ movimiento_id: nuevo.id }).eq("id", semanaId);
    if (errorLink) return { error: "El cargo se creó pero no se pudo enlazar a la semana." };
  }

  revalidatePath(`/terceros/${terceroId}`);
  revalidatePath("/movimientos");
  return null;
}

export type CargarConjuntoState = { error: string } | null;

// Combina varias semanas todavía sin cargar en un solo cargo pendiente (una
// sola cuenta por pagar), en vez de una por semana — útil cuando se acumuló
// más de una semana sin pagar y se va a saldar todo junto.
export async function cargarSemanasEnConjunto(_prev: CargarConjuntoState, formData: FormData): Promise<CargarConjuntoState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const terceroId = String(formData.get("tercero_id") || "");
  const fecha = String(formData.get("fecha") || todayISO());
  const semanaIds = formData.getAll("semana_ids").map(String).filter(Boolean);
  if (semanaIds.length < 1) return { error: "Selecciona al menos una semana." };

  const supabase = await createClient();
  const [{ data: semanas }, { data: tercero }] = await Promise.all([
    supabase.from("semanas").select("id,etiqueta,dias,movimiento_id").in("id", semanaIds),
    supabase.from("terceros").select("precio_hora").eq("id", terceroId).single(),
  ]);
  if (!semanas || !tercero) return { error: "No se encontraron las semanas o la persona." };
  if (semanas.some((s) => s.movimiento_id)) return { error: "Una de las semanas seleccionadas ya estaba cargada; actualiza la página." };

  let total = 0;
  const conceptos: string[] = [];
  for (const s of semanas) {
    const { valor } = calcularHorasSemana(s.dias, tercero.precio_hora || 0);
    total += valor;
    conceptos.push(s.etiqueta || "Servicios prestados");
  }
  total = Math.round(total * 100) / 100;
  if (total <= 0) return { error: "Las semanas seleccionadas no tienen horas registradas." };

  const { data: nuevo, error } = await supabase
    .from("movimientos_financieros")
    .insert({
      fecha,
      tipo: "egreso",
      cuenta_id: null,
      tercero_id: terceroId,
      monto: total,
      estado: "pendiente",
      concepto: conceptos.join(" + "),
      origen: "nomina",
      vinculo_id: null,
    })
    .select("id")
    .single();
  if (error || !nuevo) return { error: "No se pudo crear el cargo conjunto." };

  const { error: errorLink } = await supabase.from("semanas").update({ movimiento_id: nuevo.id }).in("id", semanaIds);
  if (errorLink) return { error: "El cargo se creó pero no se pudo enlazar todas las semanas." };

  revalidatePath(`/terceros/${terceroId}`);
  revalidatePath("/movimientos");
  revalidatePath("/cuentas-por-pagar");
  return null;
}
