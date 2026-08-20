import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel Cron llama esta ruta una vez al día (ver vercel.json) para que
// Supabase (plan gratuito) no pause el proyecto por 7 días sin actividad en
// la API — ej. si nadie entra al sistema durante unas vacaciones. Solo hace
// una lectura mínima, no expone datos.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await supabase.from("cuentas").select("id").limit(1);

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
