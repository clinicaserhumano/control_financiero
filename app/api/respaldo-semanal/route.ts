import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const REPO = "clinicaserhumano/control_financiero";

// Vercel Cron llama esta ruta una vez por semana (ver vercel.json) para
// exportar todos los datos reales a un archivo JSON y subirlo al
// repositorio privado de GitHub, en respaldos/respaldo-<fecha>.json — un
// respaldo gratuito con historial, sin depender de un plan pago de Supabase.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [cuentas, terceros, tiposMovimiento, movimientos, semanas, perfiles] = await Promise.all([
    supabase.from("cuentas").select("*"),
    supabase.from("terceros").select("*"),
    supabase.from("tipos_movimiento").select("*"),
    supabase.from("movimientos_financieros").select("*"),
    supabase.from("semanas").select("*"),
    supabase.from("perfiles_usuario").select("id,email,alias,rol,creado_en"),
  ]);

  for (const r of [cuentas, terceros, tiposMovimiento, movimientos, semanas, perfiles]) {
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
  }

  const respaldo = {
    generado_en: new Date().toISOString(),
    cuentas: cuentas.data,
    terceros: terceros.data,
    tipos_movimiento: tiposMovimiento.data,
    movimientos_financieros: movimientos.data,
    semanas: semanas.data,
    perfiles_usuario: perfiles.data,
  };

  const fecha = new Date().toISOString().slice(0, 10);
  const contenido = Buffer.from(JSON.stringify(respaldo, null, 2)).toString("base64");

  const ghRes = await fetch(`https://api.github.com/repos/${REPO}/contents/respaldos/respaldo-${fecha}.json`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_BACKUP_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: `Respaldo semanal automático ${fecha}`,
      content: contenido,
    }),
  });

  if (!ghRes.ok) {
    const detalle = await ghRes.text();
    return NextResponse.json({ error: "No se pudo subir el respaldo a GitHub", detalle }, { status: 500 });
  }

  return NextResponse.json({ ok: true, archivo: `respaldos/respaldo-${fecha}.json` });
}
