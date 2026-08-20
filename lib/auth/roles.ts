// Roles hardcodeados por correo: solo 2 cuentas reales existen para este
// sistema (una clínica), así que una tabla + UI de administración de roles
// sería sobre-ingeniería. Para agregar o cambiar un rol, edita este archivo.
// Por defecto (correo desconocido) el rol es el más restringido ('visor').

export type Rol = 'admin' | 'visor';

const ROLES: Record<string, Rol> = {
  'recepcion@serhumano.org': 'admin',
  'tubenessere@gmail.com': 'visor',
};

export function rolDe(email: string | null | undefined): Rol {
  if (!email) return 'visor';
  return ROLES[email.toLowerCase()] ?? 'visor';
}

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  visor: 'Solo lectura',
};
