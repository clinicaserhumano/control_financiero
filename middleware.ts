import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/keep-alive y api/respaldo-semanal quedan afuera: los llama Vercel
    // Cron sin sesión de usuario, se autentican con su propio secreto (ver
    // esas rutas).
    '/((?!_next/static|_next/image|favicon.ico|api/keep-alive|api/respaldo-semanal|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
