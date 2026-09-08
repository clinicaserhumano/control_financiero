"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/calculos";
import { esHoyDiaDePago } from "@/lib/notificaciones";
import { nombreCompleto } from "@/lib/terceros";
import type { DiaPago } from "@/lib/types";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type Notificaciones = {
  pagosHoy: { id: string; nombre: string }[];
  pendientesCount: number;
  pendientesTotal: number;
};

export async function obtenerNotificaciones(): Promise<Notificaciones> {
  const supabase = await createClient();
  const hoy = todayISO();

  const [{ data: terceros }, { data: pendientes }] = await Promise.all([
    supabase.from("terceros").select("id,nombre,apellido,dia_pago").eq("activo", true).not("dia_pago", "is", null),
    supabase.from("movimientos_financieros").select("monto").eq("tipo", "egreso").eq("estado", "pendiente"),
  ]);

  const pagosHoy = (terceros ?? [])
    .filter((t) => esHoyDiaDePago(t.dia_pago as DiaPago | null, hoy))
    .map((t) => ({ id: t.id, nombre: nombreCompleto(t) }));

  return {
    pagosHoy,
    pendientesCount: (pendientes ?? []).length,
    pendientesTotal: (pendientes ?? []).reduce((s, m) => s + Number(m.monto || 0), 0),
  };
}
