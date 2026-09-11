// Lógica de recordatorios de Notas — usada por la campanita de
// notificaciones y por la pantalla de Notas y Recordatorios.

import type { NotaColor, NotaRecordatorio, NotaRepetir } from './types';

export const NOTA_COLORES: NotaColor[] = ['amarillo', 'rosado', 'celeste', 'verde', 'naranja'];

export const NOTA_REPETIR_LABEL: Record<NotaRepetir, string> = {
  ninguno: 'No se repite',
  diario: 'Todos los días',
  semanal: 'Cada semana',
  mensual: 'Cada mes',
};

// Un recordatorio está vencido si su próxima fecha ya llegó (hoy o antes).
// No se compara la hora contra el reloj — el aviso aparece la primera vez
// que alguien abre el sistema ese día, no exactamente a esa hora (el
// sistema no tiene notificaciones push en segundo plano).
export function recordatorioVencido(r: NotaRecordatorio | null, hoyISO: string): boolean {
  if (!r) return false;
  return r.fecha <= hoyISO;
}

// Próxima fecha después de que un recordatorio que se repite se cumple hoy.
// Si por algún motivo quedó muy atrasado (el sistema estuvo un tiempo sin
// abrirse), avanza en el mismo intervalo hasta dejarlo en el futuro, en vez
// de notificar una sola vez y quedar años atrasado.
export function proximaFechaRecordatorio(fechaVencidaISO: string, repetir: NotaRepetir, hoyISO: string): string {
  const fecha = new Date(fechaVencidaISO + 'T00:00:00');
  const incrementar = () => {
    if (repetir === 'diario') fecha.setDate(fecha.getDate() + 1);
    else if (repetir === 'semanal') fecha.setDate(fecha.getDate() + 7);
    else if (repetir === 'mensual') fecha.setMonth(fecha.getMonth() + 1);
  };
  do {
    incrementar();
  } while (fecha.toISOString().slice(0, 10) <= hoyISO);
  return fecha.toISOString().slice(0, 10);
}

export function formatearRecordatorio(r: NotaRecordatorio, fmtDate: (iso: string) => string): string {
  const base = `${fmtDate(r.fecha)}${r.hora ? ` · ${r.hora}` : ''}`;
  if (r.repetir === 'ninguno') return base;
  return `${base} · ${NOTA_REPETIR_LABEL[r.repetir]}`;
}
