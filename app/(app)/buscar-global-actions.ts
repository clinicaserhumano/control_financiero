"use server";

import { createClient } from "@/lib/supabase/server";
import { nombreCompleto, TERCERO_TIPO_LABEL } from "@/lib/terceros";
import { money, fmtDate } from "@/lib/calculos";

export type ResultadoBusqueda = {
  tipo: "personal" | "movimiento" | "cuenta";
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

// Escapa comas y % antes de meter el texto en un filtro .or() de
// PostgREST — si no, un usuario buscando "Pérez, Juan" rompería el filtro.
function limpiar(q: string): string {
  return q.replace(/[,%]/g, " ").trim();
}

export async function buscarGlobal(query: string): Promise<ResultadoBusqueda[]> {
  const q = limpiar(query);
  if (q.length < 2) return [];

  const supabase = await createClient();

  const [{ data: terceros }, { data: movimientos }, { data: cuentas }] = await Promise.all([
    supabase
      .from("terceros")
      .select("id,nombre,apellido,tipo")
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,cedula_ruc.ilike.%${q}%`)
      .limit(6),
    supabase
      .from("movimientos_financieros")
      .select("id,tipo,concepto,monto,fecha,pagador,beneficiario")
      .neq("estado", "anulado")
      .or(
        `concepto.ilike.%${q}%,pagador.ilike.%${q}%,beneficiario.ilike.%${q}%,referencia->>cheque.ilike.%${q}%,referencia->>numero_egreso.ilike.%${q}%,referencia->>comprobante.ilike.%${q}%`
      )
      .order("fecha", { ascending: false })
      .limit(6),
    supabase.from("cuentas").select("id,empresa,banco,numero").or(`empresa.ilike.%${q}%,banco.ilike.%${q}%,numero.ilike.%${q}%`).limit(4),
  ]);

  const resultados: ResultadoBusqueda[] = [];

  (terceros ?? []).forEach((t) => {
    resultados.push({
      tipo: "personal",
      id: t.id,
      titulo: nombreCompleto(t),
      subtitulo: TERCERO_TIPO_LABEL[t.tipo],
      href: `/terceros/${t.id}`,
    });
  });

  // Al hacer clic va al listado ya filtrado (no al comprobante impreso, que
  // se autoimprime al abrirlo — sería una sorpresa fea desde una búsqueda).
  (movimientos ?? []).forEach((m) => {
    resultados.push({
      tipo: "movimiento",
      id: m.id,
      titulo: m.concepto || m.pagador || m.beneficiario || "(sin concepto)",
      subtitulo: `${m.tipo === "ingreso" ? "Ingreso" : "Egreso"} · ${money(m.monto)} · ${fmtDate(m.fecha)}`,
      href: `/movimientos?tipo=${m.tipo}&q=${encodeURIComponent(q)}`,
    });
  });

  (cuentas ?? []).forEach((c) => {
    resultados.push({
      tipo: "cuenta",
      id: c.id,
      titulo: c.empresa,
      subtitulo: `${c.banco} ${c.numero}`,
      href: `/cuentas/${c.id}`,
    });
  });

  return resultados;
}
