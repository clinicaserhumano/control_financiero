import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/keep-alive y api/respaldo-semanal quedan afuera: los llama Vercel
    // Cron sin sesión de usuario, se autentican con su propio secreto (ver
    // esas rutas). auth/confirmar queda afuera porque todavía no hay sesión
    // cuando alguien abre el enlace de recuperación de contraseña — si el
    // middleware corriera ahí, redirigiría a /login antes de poder canjear
    // el código y crear la sesión.
    '/((?!_next/static|_next/image|favicon.ico|api/keep-alive|api/respaldo-semanal|auth/confirmar|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
