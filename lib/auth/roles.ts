export type Rol = 'admin' | 'visor';

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  visor: 'Solo lectura',
};
