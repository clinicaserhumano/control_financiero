import { createClient } from '@/lib/supabase/server';
import { rolDe } from './roles';

// Segunda capa de defensa: la interfaz ya oculta/deshabilita todo lo que un
// 'visor' no puede hacer, pero cada Server Action que escribe datos vuelve a
// verificar el rol por su cuenta — nunca confiar solo en lo que oculta el cliente.
export async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (rolDe(user?.email) !== 'admin') {
    return { ok: false, error: 'No tienes permiso para hacer esto (acceso de solo lectura).' };
  }
  return { ok: true };
}
