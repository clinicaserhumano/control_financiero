"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/calculos";
import { esHoyDiaDePago } from "@/lib/notificaciones";
import { recordatorioVencido } from "@/lib/notas";
import { nombreCompleto } from "@/lib/terceros";
import type { DiaPago, NotaRecordatorio } from "@/lib/types";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type Notificaciones = {
  pagosHoy: { id: string; nombre: string }[];
  pendientesCount: number;
  pendientesTotal: number;
  notasVencidas: { id: string; titulo: string }[];
};

export async function obtenerNotificaciones(): Promise<Notificaciones> {
  const supabase = await createClient();
  const hoy = todayISO();

  const [{ data: terceros }, { data: pendientes }, { data: notas }] = await Promise.all([
    supabase.from("terceros").select("id,nombre,apellido,dia_pago").eq("activo", true).not("dia_pago", "is", null),
    supabase.from("movimientos_financieros").select("monto").eq("tipo", "egreso").eq("estado", "pendiente"),
    supabase.from("notas").select("id,titulo,recordatorio").not("recordatorio", "is", null),
  ]);

  const pagosHoy = (terceros ?? [])
    .filter((t) => esHoyDiaDePago(t.dia_pago as DiaPago | null, hoy))
    .map((t) => ({ id: t.id, nombre: nombreCompleto(t) }));

  const notasVencidas = (notas ?? [])
    .filter((n) => recordatorioVencido(n.recordatorio as NotaRecordatorio | null, hoy))
    .map((n) => ({ id: n.id, titulo: n.titulo }));

  return {
    pagosHoy,
    pendientesCount: (pendientes ?? []).length,
    pendientesTotal: (pendientes ?? []).reduce((s, m) => s + Number(m.monto || 0), 0),
    notasVencidas,
  };
}
