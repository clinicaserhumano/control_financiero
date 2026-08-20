import type { TerceroTipo } from './types';

export const TERCERO_TIPO_LABEL: Record<TerceroTipo, string> = {
  proveedor: 'Proveedor',
  empleado: 'Servicios prestados',
  afiliado: 'Personal afiliado',
  paciente_cliente: 'Paciente / Cliente',
  otro: 'Otro',
};

// Pestañas del módulo Personal (antes "Terceros"). "Servicios prestados" son
// terceros tipo 'empleado' que tienen sueldo asignado (se liquidan por
// bitácora de horas). No incluye pacientes/clientes: en esta clínica siempre
// pagan antes de la consulta, así que nunca hay saldo por cobrar que
// justifique una ficha — quién paga un ingreso es solo un nombre libre
// (columna `pagador` en movimientos_financieros), no un tercero.
export const TERCERO_TABS = [
  { grupo: 'proveedor', label: 'Proveedores' },
  { grupo: 'empleado', label: 'Servicios prestados' },
  { grupo: 'afiliado', label: 'Personal afiliado' },
] as const;

export type TerceroGrupo = (typeof TERCERO_TABS)[number]['grupo'];

export function nombreCompleto(t: { nombre: string; apellido: string | null }): string {
  return [t.nombre, t.apellido].filter(Boolean).join(' ').trim();
}

// Todo tercero visible en el módulo Personal es contraparte de un egreso
// (proveedor, servicios prestados, personal afiliado).
export function direccionParaTercero(): 'egreso' {
  return 'egreso';
}
