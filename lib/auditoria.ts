import { createClient } from './supabase/server';
import { obtenerPerfilActual } from './auth/perfil';

// Historial de auditoría: se llama desde dentro de una Server Action, DESPUÉS
// de que la operación principal ya tuvo éxito — si guardar el registro
// fallara por lo que sea, nunca debe tumbar la acción real del usuario, por
// eso se traga cualquier error acá adentro en vez de dejarlo propagar.
export async function registrarAuditoria(accion: string, detalle: string): Promise<void> {
  try {
    const supabase = await createClient();
    const perfil = await obtenerPerfilActual();
    await supabase.from('auditoria').insert({
      accion,
      detalle,
      usuario_email: perfil?.email ?? null,
      usuario_alias: perfil?.alias ?? null,
    });
  } catch {
    // Silencioso a propósito — ver comentario arriba.
  }
}
