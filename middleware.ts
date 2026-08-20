import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/keep-alive queda afuera: lo llama Vercel Cron sin sesión de
    // usuario, se autentica con su propio secreto (ver esa ruta).
    '/((?!_next/static|_next/image|favicon.ico|api/keep-alive|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
