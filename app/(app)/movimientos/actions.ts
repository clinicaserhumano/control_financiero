"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type MovimientoFormState = { error: string } | null;

// Los campos dinámicos de <FormularioMovimiento> viajan como "campo__<clave>"
// para no chocar con los campos fijos del formulario.
function leerReferencia(formData: FormData): Record<string, string> {
  const referencia: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.startsWith("campo__") && typeof value === "string" && value.trim()) {
      referencia[key.slice("campo__".length)] = value.trim();
    }
  });
  return referencia;
}

async function validarCamposExtra(
  supabase: SupabaseClient<Database>,
  tipoMovimientoId: string,
  referencia: Record<string, string>
): Promise<string | null> {
  const { data: tm } = await supabase
    .from("tipos_movimiento")
    .select("campos_extra")
    .eq("id", tipoMovimientoId)
    .single();
  const campos = tm?.campos_extra ?? [];
  for (const c of campos) {
    if (c.requerido && !referencia[c.clave]) return `Falta el campo "${c.etiqueta}".`;
  }
  return null;
}

// Descuento opcional al momento de pagar un egreso: reduce el monto que
// realmente sale de la cuenta (fuente única del saldo), guardando el valor
// descontado por separado para trazabilidad. montoBase es el valor original
// adeudado; el resultado nunca puede llegar a $0 (monto > 0 en la BD).
type ResultadoDescuento =
  | { ok: true; montoFinal: number; descuento: number | null; observaciones: string | null }
  | { ok: false; error: string };

function leerDescuento(formData: FormData, montoBase: number): ResultadoDescuento {
  const observaciones = String(formData.get("observaciones") || "").trim() || null;
  const descuentoRaw = String(formData.get("descuento") || "").trim();
  if (!descuentoRaw) return { ok: true, montoFinal: montoBase, descuento: null, observaciones };
  const descuento = parseFloat(descuentoRaw);
  if (isNaN(descuento) || descuento < 0) return { ok: false, error: "El descuento no es válido." };
  if (descuento >= montoBase) return { ok: false, error: "El descuento no puede ser mayor o igual al valor original." };
  return { ok: true, montoFinal: Math.round((montoBase - descuento) * 100) / 100, descuento, observaciones };
}

function revalidarTodo(cuentaId: string | null, terceroId: string | null) {
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/cuentas-por-pagar");
  if (cuentaId) revalidatePath(`/cuentas/${cuentaId}`);
  if (terceroId) revalidatePath(`/terceros/${terceroId}`);
}

export async function crearMovimiento(_prev: MovimientoFormState, formData: FormData): Promise<MovimientoFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const tipo = String(formData.get("tipo") || "") as "ingreso" | "egreso";
  const tipoMovimientoId = String(formData.get("tipo_movimiento_id") || "");
  const terceroId = String(formData.get("tercero_id") || "") || null;
  const pagador = String(formData.get("pagador") || "").trim() || null;
  const beneficiario = String(formData.get("beneficiario") || "").trim() || null;
  const razonRadio = String(formData.get("razon_egreso_radio") || "").trim();
  const razonOtros = String(formData.get("razon_egreso_otros") || "").trim();
  const razonEgreso = razonRadio === "Otros" ? razonOtros || null : razonRadio || null;
  const monto = parseFloat(String(formData.get("monto") || ""));
  const fecha = String(formData.get("fecha") || "");
  const concepto = String(formData.get("concepto") || "").trim() || null;
  // Los ingresos siempre se registran ya cobrados; los egresos pueden quedar pendientes.
  const confirmarAhora = tipo === "ingreso" || String(formData.get("confirmar_ahora") || "si") === "si";
  const cuentaId = String(formData.get("cuenta_id") || "") || null;
  const fechaPagoForm = String(formData.get("fecha_pago") || "");
  const redirectTo = String(formData.get("redirect_to") || `/movimientos?tipo=${tipo}`);

  if (tipo !== "ingreso" && tipo !== "egreso") return { error: "Tipo de movimiento inválido." };
  if (!tipoMovimientoId) return { error: "Selecciona el tipo de movimiento." };
  if (isNaN(monto) || monto <= 0) return { error: "Ingresa un monto válido." };
  if (!fecha) return { error: "Ingresa la fecha." };
  if (confirmarAhora && !cuentaId) return { error: "Selecciona la cuenta." };

  const supabase = await createClient();
  const referencia = leerReferencia(formData);
  const errorCampos = await validarCamposExtra(supabase, tipoMovimientoId, referencia);
  if (errorCampos) return { error: errorCampos };

  let montoFinal = monto;
  let descuento: number | null = null;
  let observaciones: string | null = null;
  if (tipo === "egreso" && confirmarAhora) {
    const r = leerDescuento(formData, monto);
    if (!r.ok) return { error: r.error };
    montoFinal = r.montoFinal;
    descuento = r.descuento;
    observaciones = r.observaciones;
  }

  const { error } = await supabase.from("movimientos_financieros").insert({
    fecha,
    fecha_pago: confirmarAhora ? fechaPagoForm || fecha : null,
    tipo,
    tipo_movimiento_id: tipoMovimientoId,
    cuenta_id: cuentaId,
    tercero_id: terceroId,
    monto: montoFinal,
    estado: confirmarAhora ? "confirmado" : "pendiente",
    concepto,
    referencia,
    descuento,
    observaciones,
    pagador: tipo === "ingreso" ? pagador : null,
    beneficiario: tipo === "egreso" ? beneficiario : null,
    razon_egreso: tipo === "egreso" ? razonEgreso : null,
  });
  if (error) return { error: "No se pudo guardar el movimiento." };

  revalidarTodo(cuentaId, terceroId);
  redirect(redirectTo);
}

export async function confirmarPago(_prev: MovimientoFormState, formData: FormData): Promise<MovimientoFormState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const movimientoId = String(formData.get("movimiento_id") || "");
  const tipoMovimientoId = String(formData.get("tipo_movimiento_id") || "");
  const cuentaId = String(formData.get("cuenta_id") || "");
  const fechaPago = String(formData.get("fecha_pago") || "");
  const concepto = String(formData.get("concepto") || "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") || "/movimientos");

  if (!movimientoId) return { error: "Movimiento no encontrado." };
  if (!tipoMovimientoId) return { error: "Selecciona la forma de pago." };
  if (!cuentaId) return { error: "Selecciona la cuenta." };
  if (!fechaPago) return { error: "Ingresa la fecha de pago." };

  const supabase = await createClient();
  const referencia = leerReferencia(formData);
  const errorCampos = await validarCamposExtra(supabase, tipoMovimientoId, referencia);
  if (errorCampos) return { error: errorCampos };

  const { data: original } = await supabase
    .from("movimientos_financieros")
    .select("tercero_id,monto,tipo")
    .eq("id", movimientoId)
    .single();
  if (!original) return { error: "Movimiento no encontrado." };

  let montoFinal = original.monto;
  let descuento: number | null = null;
  let observaciones: string | null = null;
  if (original.tipo === "egreso") {
    const r = leerDescuento(formData, original.monto);
    if (!r.ok) return { error: r.error };
    montoFinal = r.montoFinal;
    descuento = r.descuento;
    observaciones = r.observaciones;
  }

  const { error } = await supabase
    .from("movimientos_financieros")
    .update({
      estado: "confirmado",
      cuenta_id: cuentaId,
      fecha_pago: fechaPago,
      tipo_movimiento_id: tipoMovimientoId,
      concepto,
      referencia,
      monto: montoFinal,
      descuento,
      observaciones,
    })
    .eq("id", movimientoId);
  if (error) return { error: "No se pudo registrar el pago." };

  revalidarTodo(cuentaId, original?.tercero_id ?? null);
  redirect(redirectTo);
}

export async function anularMovimiento(id: string) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  const { data: mov } = await supabase
    .from("movimientos_financieros")
    .select("cuenta_id,tercero_id")
    .eq("id", id)
    .single();
  await supabase.from("movimientos_financieros").update({ estado: "anulado" }).eq("id", id);
  revalidarTodo(mov?.cuenta_id ?? null, mov?.tercero_id ?? null);
}
