"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CuentaFormState = { error: string } | null;

function leerCampos(formData: FormData) {
  return {
    empresa: String(formData.get("empresa") || "").trim().toUpperCase(),
    ruc: String(formData.get("ruc") || "").trim(),
    banco: String(formData.get("banco") || "").trim().toUpperCase(),
    tipo: String(formData.get("tipo") || "CTA-CTE"),
    numero: String(formData.get("numero") || "").trim(),
    elaborado: String(formData.get("elaborado") || "").trim() || "Contabilidad",
    aprobado: String(formData.get("aprobado") || "").trim() || null,
  };
}

export async function guardarCuenta(_prev: CuentaFormState, formData: FormData): Promise<CuentaFormState> {
  const editandoId = String(formData.get("id") || "");
  const campos = leerCampos(formData);

  if (!campos.empresa || !campos.ruc || !campos.banco || !campos.numero) {
    return { error: "Completa empresa, RUC, banco y N° de cuenta." };
  }

  const supabase = await createClient();

  if (editandoId) {
    const { error } = await supabase.from("cuentas").update(campos).eq("id", editandoId);
    if (error) return { error: "No se pudo actualizar la cuenta." };
  } else {
    const { error } = await supabase.from("cuentas").insert(campos);
    if (error) return { error: "No se pudo crear la cuenta." };
  }

  revalidatePath("/cuentas");
  redirect("/cuentas");
}

export async function eliminarCuenta(id: string) {
  const supabase = await createClient();
  await supabase.from("cuentas").delete().eq("id", id);
  revalidatePath("/cuentas");
}
