import { createClient } from '@/lib/supabase/server';
import type { Rol } from './roles';

export type Perfil = { id: string; email: string; alias: string; rol: Rol };

// Perfil (alias + rol) del usuario que tiene la sesión activa, leído de
// perfiles_usuario. Si por algún motivo no tiene fila ahí (cuenta creada a
// mano en Supabase, fuera de la pantalla de Usuarios) cae al rol más
// restringido, igual que antes cuando los roles estaban hardcodeados.
export async function obtenerPerfilActual(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('perfiles_usuario').select('id,email,alias,rol').eq('id', user.id).single();
  if (!data) return { id: user.id, email: user.email ?? '', alias: user.email ?? 'Usuario', rol: 'visor' };
  return data;
}
