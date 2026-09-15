import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Adonde llega el enlace que Supabase manda por correo al pedir recuperar
// contraseña (resetPasswordForEmail), usando la plantilla de correo POR
// DEFECTO de Supabase (editar la plantilla pide SMTP propio, que no está
// configurado). Con la plantilla por defecto, el código llega como "code"
// en la URL — solo funciona si se abre desde el mismo navegador/dispositivo
// donde se pidió el cambio (queda atado a una cookie de ese navegador). Si
// más adelante se configura SMTP propio, se puede cambiar a token_hash para
// que funcione desde cualquier dispositivo. Excluido del middleware de
// sesión (ver middleware.ts) porque todavía no hay usuario logueado aquí.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/restablecer-contrasena";
  const origin = request.nextUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Motivo real (temporal, para diagnosticar): Supabase manda cosas como
    // "invalid flow state, no valid flow state found" (típico del código
    // abierto en otro navegador/dispositivo) o "otp_expired" (enlace vencido).
    return NextResponse.redirect(`${origin}/login?error=link_invalido&motivo=${encodeURIComponent(error.message)}`);
  }

  const errorParam = request.nextUrl.searchParams.get("error_description") || request.nextUrl.searchParams.get("error");
  return NextResponse.redirect(`${origin}/login?error=link_invalido${errorParam ? `&motivo=${encodeURIComponent(errorParam)}` : ""}`);
}
