export type Rol = 'admin' | 'visor';

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  visor: 'Solo lectura',
};

// Cuenta principal de la clínica: nunca se puede borrar desde Usuarios,
// pase lo que pase con su rol — es el único acceso garantizado al sistema.
export const USUARIO_PROTEGIDO = 'recepcion@serhumano.org';
