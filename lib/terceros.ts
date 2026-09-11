import type { HorarioDia, TerceroTipo } from './types';

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

export const ORDEN_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// "Lunes a Viernes 09:30–17:00 · Sábado 09:00–14:00": agrupa días
// consecutivos con el mismo horario para que se lea de corrido, en vez de
// repetir la misma hora día por día.
export function formatearHorario(horario: HorarioDia[] | null | undefined): string {
  const porDia = new Map((horario ?? []).map((h) => [h.dia, h]));
  const activos = ORDEN_DIAS.map((dia) => porDia.get(dia)).filter(
    (h): h is HorarioDia => !!h && !!h.entrada && !!h.salida
  );
  if (activos.length === 0) return '';

  const grupos: { desde: string; hasta: string; entrada: string; salida: string }[] = [];
  for (const h of activos) {
    const ultimo = grupos[grupos.length - 1];
    const idxActual = ORDEN_DIAS.indexOf(h.dia);
    const idxUltimo = ultimo ? ORDEN_DIAS.indexOf(ultimo.hasta) : -99;
    if (ultimo && ultimo.entrada === h.entrada && ultimo.salida === h.salida && idxActual === idxUltimo + 1) {
      ultimo.hasta = h.dia;
    } else {
      grupos.push({ desde: h.dia, hasta: h.dia, entrada: h.entrada, salida: h.salida });
    }
  }
  return grupos
    .map((g) => `${g.desde === g.hasta ? g.desde : `${g.desde} a ${g.hasta}`} ${g.entrada}–${g.salida}`)
    .join(' · ');
}
