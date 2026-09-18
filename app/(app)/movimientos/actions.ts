"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type MovimientoFormState = { error: string } | null;
export type ConfirmarPagoState = { error: string } | { ok: true; movimientoId: string; redirectTo: string } | null;

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

async function obtenerTipoMovimiento(supabase: SupabaseClient<Database>, tipoMovimientoId: string) {
  const { data } = await supabase
    .from("tipos_movimiento")
    .select("campos_extra,requiere_cuenta")
    .eq("id", tipoMovimientoId)
    .single();
  return data ?? { campos_extra: [], requiere_cuenta: true };
}

function validarCamposExtra(campos: { clave: string; etiqueta: string; requerido: boolean }[], referencia: Record<string, string>): string | null {
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

// IVA (15%) sobre pagos a Personal por Servicios prestados: opcional, se
// suma al valor original ANTES de aplicar un posible descuento. El check del
// formulario (<FormularioMovimiento>) solo lo muestra para esos pagos, pero
// el cálculo real vive aquí — nunca se confía en un monto final armado en
// el cliente.
function aplicarIVA(formData: FormData, montoBase: number): number {
  if (formData.get("incluir_iva") !== "si") return montoBase;
  return Math.round(montoBase * 1.15 * 100) / 100;
}

// Si se marcó incluir IVA, asegura el sufijo "+ IVA" en el concepto aunque
// el cliente no lo haya agregado (JS deshabilitado, envío manual, etc.) —
// idempotente: no lo duplica si ya viene incluido.
function conSufijoIVA(formData: FormData, concepto: string | null): string | null {
  if (formData.get("incluir_iva") !== "si" || !concepto) return concepto;
  return /\+\s*iva\s*$/i.test(concepto) ? concepto : `${concepto} + IVA`;
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
  const concepto = conSufijoIVA(formData, String(formData.get("concepto") || "").trim() || null);
  // Los ingresos siempre se registran ya cobrados; los egresos pueden quedar pendientes.
  const confirmarAhora = tipo === "ingreso" || String(formData.get("confirmar_ahora") || "si") === "si";
  const cuentaId = String(formData.get("cuenta_id") || "") || null;
  const fechaPagoForm = String(formData.get("fecha_pago") || "");
  const redirectTo = String(formData.get("redirect_to") || `/movimientos?tipo=${tipo}`);

  if (tipo !== "ingreso" && tipo !== "egreso") return { error: "Tipo de movimiento inválido." };
  if (!tipoMovimientoId) return { error: "Selecciona el tipo de movimiento." };
  if (isNaN(monto) || monto <= 0) return { error: "Ingresa un monto válido." };
  if (!fecha) return { error: "Ingresa la fecha." };

  const supabase = await createClient();
  const referencia = leerReferencia(formData);
  const tipoMovimiento = await obtenerTipoMovimiento(supabase, tipoMovimientoId);
  const errorCampos = validarCamposExtra(tipoMovimiento.campos_extra, referencia);
  if (errorCampos) return { error: errorCampos };
  if (confirmarAhora && tipoMovimiento.requiere_cuenta && !cuentaId) return { error: "Selecciona la cuenta." };

  let montoFinal = monto;
  let descuento: number | null = null;
  let observaciones: string | null = null;
  if (tipo === "egreso" && confirmarAhora) {
    const r = leerDescuento(formData, aplicarIVA(formData, monto));
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

export async function confirmarPago(_prev: ConfirmarPagoState, formData: FormData): Promise<ConfirmarPagoState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const movimientoId = String(formData.get("movimiento_id") || "");
  const tipoMovimientoId = String(formData.get("tipo_movimiento_id") || "");
  const cuentaId = String(formData.get("cuenta_id") || "") || null;
  const fechaPago = String(formData.get("fecha_pago") || "");
  const concepto = conSufijoIVA(formData, String(formData.get("concepto") || "").trim() || null);
  const redirectTo = String(formData.get("redirect_to") || "/movimientos");

  if (!movimientoId) return { error: "Movimiento no encontrado." };
  if (!tipoMovimientoId) return { error: "Selecciona la forma de pago." };
  if (!fechaPago) return { error: "Ingresa la fecha de pago." };

  const supabase = await createClient();
  const referencia = leerReferencia(formData);
  const tipoMovimiento = await obtenerTipoMovimiento(supabase, tipoMovimientoId);
  const errorCampos = validarCamposExtra(tipoMovimiento.campos_extra, referencia);
  if (errorCampos) return { error: errorCampos };
  if (tipoMovimiento.requiere_cuenta && !cuentaId) return { error: "Selecciona la cuenta." };

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
    const r = leerDescuento(formData, aplicarIVA(formData, original.monto));
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
  return { ok: true, movimientoId, redirectTo };
}

export type ConfirmarConjuntoState = { error: string } | { ok: true; redirectTo: string } | null;

// Combina varios egresos pendientes en un solo pago (un solo cheque/forma de
// pago para todos) — cada uno sigue siendo su propia fila en la base, para
// no perder el detalle de qué período o factura cubre cada uno, pero
// comparten cuenta, fecha de pago, forma de pago y N° de cheque. Un
// descuento sobre el total (si hay) se deja completo en el último de la
// lista, visible ahí — repartirlo en silencio entre varios cargos distintos
// sería más confuso que dejarlo en uno solo y explicado.
export async function confirmarPagoConjunto(_prev: ConfirmarConjuntoState, formData: FormData): Promise<ConfirmarConjuntoState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const ids = formData.getAll("movimiento_ids").map(String).filter(Boolean);
  const tipoMovimientoId = String(formData.get("tipo_movimiento_id") || "");
  const cuentaId = String(formData.get("cuenta_id") || "") || null;
  const fechaPago = String(formData.get("fecha_pago") || "");
  const redirectTo = String(formData.get("redirect_to") || "/movimientos");

  if (ids.length < 2) return { error: "Selecciona al menos dos movimientos para combinar." };
  if (!tipoMovimientoId) return { error: "Selecciona la forma de pago." };
  if (!fechaPago) return { error: "Ingresa la fecha de pago." };

  const supabase = await createClient();
  const referencia = leerReferencia(formData);
  const tipoMovimiento = await obtenerTipoMovimiento(supabase, tipoMovimientoId);
  const errorCampos = validarCamposExtra(tipoMovimiento.campos_extra, referencia);
  if (errorCampos) return { error: errorCampos };
  if (tipoMovimiento.requiere_cuenta && !cuentaId) return { error: "Selecciona la cuenta." };

  const { data: originales } = await supabase
    .from("movimientos_financieros")
    .select("id,tercero_id,monto,estado,concepto")
    .in("id", ids);
  if (!originales || originales.length !== ids.length) return { error: "Alguno de los movimientos ya no existe." };
  if (originales.some((m) => m.estado !== "pendiente")) {
    return { error: "Alguno de los movimientos seleccionados ya no está pendiente — actualiza la página." };
  }

  // El IVA se calcula por movimiento (cada cargo + su 15%) y no sobre el
  // total ya sumado — matemáticamente da lo mismo, pero así cada fila queda
  // con su propio monto real en la base, no uno solo inflado con todo el IVA.
  const montosConIVA = originales.map((m) => aplicarIVA(formData, Number(m.monto)));
  const totalBase = montosConIVA.reduce((s, m) => s + m, 0);
  const r = leerDescuento(formData, totalBase);
  if (!r.ok) return { error: r.error };

  for (let i = 0; i < originales.length; i++) {
    const m = originales[i];
    const esUltimo = i === originales.length - 1;
    const montoFinal = esUltimo && r.descuento ? montosConIVA[i] - r.descuento : montosConIVA[i];
    const { error } = await supabase
      .from("movimientos_financieros")
      .update({
        estado: "confirmado",
        cuenta_id: cuentaId,
        fecha_pago: fechaPago,
        tipo_movimiento_id: tipoMovimientoId,
        referencia,
        monto: montoFinal,
        concepto: conSufijoIVA(formData, m.concepto),
        descuento: esUltimo ? r.descuento : null,
        observaciones: esUltimo ? r.observaciones : null,
      })
      .eq("id", m.id);
    if (error) return { error: "No se pudo registrar el pago combinado." };
  }

  revalidarTodo(cuentaId, null);
  originales.forEach((m) => m.tercero_id && revalidatePath(`/terceros/${m.tercero_id}`));
  return { ok: true, redirectTo };
}

export type EditarDetalleState = { error: string } | { ok: true; redirectTo: string } | null;

// Un movimiento ya confirmado nunca cambia su monto, fecha, cuenta ni
// beneficiario — eso sigue exigiendo anular y crear uno nuevo, para no abrir
// la puerta a alterar el dinero después del hecho. Pero un dato como el
// número de cheque escrito mal, o el concepto, no afecta ningún saldo — así
// que se puede corregir directo, sin perder el N° de egreso ya asignado.
export async function editarDetalleMovimiento(_prev: EditarDetalleState, formData: FormData): Promise<EditarDetalleState> {
  const chk = await requireAdmin();
  if (!chk.ok) return { error: chk.error };

  const movimientoId = String(formData.get("movimiento_id") || "");
  const redirectTo = String(formData.get("redirect_to") || "/movimientos");
  if (!movimientoId) return { error: "Movimiento no encontrado." };

  const supabase = await createClient();
  const { data: original } = await supabase
    .from("movimientos_financieros")
    .select("estado,cuenta_id,tercero_id,tipo_movimiento_id,referencia")
    .eq("id", movimientoId)
    .single();
  if (!original) return { error: "Movimiento no encontrado." };
  if (original.estado !== "confirmado") {
    return { error: "Solo se pueden editar estos datos en movimientos ya confirmados." };
  }

  const concepto = String(formData.get("concepto") || "").trim() || null;
  const observaciones = String(formData.get("observaciones") || "").trim() || null;

  const tipoMovimiento = await obtenerTipoMovimiento(supabase, original.tipo_movimiento_id || "");
  const referenciaForm = leerReferencia(formData);
  const errorCampos = validarCamposExtra(tipoMovimiento.campos_extra, referenciaForm);
  if (errorCampos) return { error: errorCampos };

  // El N° de egreso no viene del formulario (no es editable) — se conserva
  // tal cual estaba, aunque el resto de referencia (cheque, comprobante…) se
  // reemplace con lo que se acaba de corregir.
  const numeroEgreso = (original.referencia as Record<string, unknown> | null)?.numero_egreso;
  const referencia: Record<string, string> =
    typeof numeroEgreso === "number"
      ? ({ ...referenciaForm, numero_egreso: numeroEgreso } as unknown as Record<string, string>)
      : referenciaForm;

  const { error } = await supabase
    .from("movimientos_financieros")
    .update({ concepto, observaciones, referencia })
    .eq("id", movimientoId);
  if (error) return { error: "No se pudo guardar." };

  revalidarTodo(original.cuenta_id, original.tercero_id);
  return { ok: true, redirectTo };
}

export async function anularMovimiento(id: string) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  const supabase = await createClient();
  const { data: mov } = await supabase
    .from("movimientos_financieros")
    .select("cuenta_id,tercero_id,origen")
    .eq("id", id)
    .single();
  await supabase.from("movimientos_financieros").update({ estado: "anulado" }).eq("id", id);
  // Si el cargo venía de una o varias semanas de bitácora, se desligan para
  // que vuelvan a quedar "sin cargar" — si no, quedarían apuntando para
  // siempre a un cargo anulado, sin forma de rehacerlas desde la bitácora.
  if (mov?.origen === "nomina") {
    await supabase.from("semanas").update({ movimiento_id: null }).eq("movimiento_id", id);
  }
  revalidarTodo(mov?.cuenta_id ?? null, mov?.tercero_id ?? null);
}
