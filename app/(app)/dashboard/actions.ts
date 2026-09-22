"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CATEGORIAS_PRESUPUESTO } from "@/lib/dashboard";

export type PresupuestosState = { error: string } | { ok: true } | null;

// Un presupuesto por categoría, todos opcionales — 0 significa "sin
// presupuesto establecido" y el Dashboard no lo compara contra nada.
export async function actualizarPresupuestos(_prev: PresupuestosState, formData: FormData): Promise<PresupuestosState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const supabase = await createClient();
  for (const categoria of CATEGORIAS_PRESUPUESTO) {
    const raw = String(formData.get(`presupuesto__${categoria}`) || "").trim();
    const monto = raw ? parseFloat(raw) : 0;
    if (isNaN(monto) || monto < 0) return { error: `El presupuesto de "${categoria}" no es válido.` };

    const { error } = await supabase
      .from("presupuestos")
      .update({ monto_mensual: monto, actualizado_en: new Date().toISOString() })
      .eq("categoria", categoria);
    if (error) return { error: "No se pudo guardar el presupuesto." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
