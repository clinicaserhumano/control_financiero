import { obtenerPerfilActual } from './perfil';

// Segunda capa de defensa: la interfaz ya oculta/deshabilita todo lo que un
// 'visor' no puede hacer, pero cada Server Action que escribe datos vuelve a
// verificar el rol por su cuenta — nunca confiar solo en lo que oculta el cliente.
export async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol !== 'admin') {
    return { ok: false, error: 'No tienes permiso para hacer esto (acceso de solo lectura).' };
  }
  return { ok: true };
}
