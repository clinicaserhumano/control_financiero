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

export async function anularSeleccionados(ids: string[]) {
  const chk = await requireAdmin();
  if (!chk.ok) return;
  if (!ids.length) return;
  const supabase = await createClient();
  const { data: afectados } = await supabase.from("movimientos_financieros").select("tercero_id").in("id", ids);
  // Sin filtro de estado: igual que anular uno por uno, permite anular tanto
  // pendientes (Cuentas por Pagar, ficha de Personal) como confirmados
  // (listado de Ingresos/Egresos, donde ambos estados son seleccionables).
  await supabase.from("movimientos_financieros").update({ estado: "anulado" }).in("id", ids).neq("estado", "anulado");
  // Los que venían de bitácora se desligan para que sus semanas vuelvan a
  // quedar "sin cargar" (ver la misma lógica en anularMovimiento); no afecta
  // a los demás, ninguna semana apunta a un movimiento que no sea de nómina.
  await supabase.from("semanas").update({ movimiento_id: null }).in("movimiento_id", ids);
  revalidarTodo((afectados ?? []).map((m) => m.tercero_id));
}
