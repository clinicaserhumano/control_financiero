import type { TerceroTipo } from './types';

export const TERCERO_TIPO_LABEL: Record<TerceroTipo, string> = {
  proveedor: 'Proveedor',
  empleado: 'Servicios prestados',
  afiliado: 'Personal afiliado',
  paciente_cliente: 'Paciente / Cliente',
  otro: 'Otro',
};

// Pestañas del módulo /terceros. "Servicios prestados" son terceros tipo
// 'empleado' que tienen sueldo asignado (se liquidan por bitácora de horas).
export const TERCERO_TABS = [
  { grupo: 'proveedor', label: 'Proveedores' },
  { grupo: 'empleado', label: 'Servicios prestados' },
  { grupo: 'afiliado', label: 'Personal afiliado' },
  { grupo: 'paciente_cliente', label: 'Pacientes / Clientes' },
] as const;

export type TerceroGrupo = (typeof TERCERO_TABS)[number]['grupo'];

export function nombreCompleto(t: { nombre: string; apellido: string | null }): string {
  return [t.nombre, t.apellido].filter(Boolean).join(' ').trim();
}

// Un tercero tipo 'paciente_cliente' es la contraparte de un ingreso;
// cualquier otro tipo (proveedor, empleado, afiliado) es contraparte de un egreso.
export function direccionParaTercero(tipo: TerceroTipo): 'ingreso' | 'egreso' {
  return tipo === 'paciente_cliente' ? 'ingreso' : 'egreso';
}
