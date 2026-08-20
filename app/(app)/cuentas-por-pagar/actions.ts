"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

function revalidarTodo(terceroIds: (string | null)[]) {
  revalidatePath("/cuentas-por-pagar");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  terceroIds.forEach((id) => id && revalidatePath(`/terceros/${id}`));
}

export type MarcarPagadosState = { error: string } | null;

// Confirmación masiva "rápida": no pide forma de pago ni campos_extra (eso
// se hace fila por fila desde "Registrar pago" cuando hace falta el detalle).
export async function marcarPagadosMasivo(_prev: MarcarPagadosState, formData: FormData): Promise<MarcarPagadosState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const cuentaId = String(formData.get("cuenta_id") || "");
  const fechaPago = String(formData.get("fecha_pago") || "");

  if (!ids.length) return { error: "Selecciona al menos un registro." };
  if (!cuentaId) return { error: "Selecciona la cuenta desde la que se paga." };
  if (!fechaPago) return { error: "Ingresa la fecha de pago." };

  const supabase = await createClient();
  const { data: afectados } = await supabase.from("movimientos_financieros").select("tercero_id").in("id", ids);

  const { error } = await supabase
    .from("movimientos_financieros")
    .update({ estado: "confirmado", cuenta_id: cuentaId, fecha_pago: fechaPago })
    .in("id", ids)
    .eq("estado", "pendiente");
  if (error) return { error: "No se pudo marcar como pagados." };

  revalidarTodo((afectados ?? []).map((m) => m.tercero_id));
  return null;
}

export async function anularSeleccionados(ids: string[]) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  if (!ids.length) return;
  const supabase = await createClient();
  const { data: afectados } = await supabase.from("movimientos_financieros").select("tercero_id").in("id", ids);
  await supabase.from("movimientos_financieros").update({ estado: "anulado" }).in("id", ids).eq("estado", "pendiente");
  revalidarTodo((afectados ?? []).map((m) => m.tercero_id));
}
