// Lógica del "día de pago" habitual de Personal (servicios prestados y
// afiliados), usada por la campanita de notificaciones del header.

import { fmtDate } from './calculos';
import type { DiaPago } from './types';

export const DIA_SEMANA_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Si el día configurado no existe en el mes actual (ej. 30 en febrero), se
// usa el último día del mes en su lugar.
function diaValidoDelMes(fecha: Date, dia: number): number {
  const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  return Math.min(dia, ultimoDiaMes);
}

export function esHoyDiaDePago(diaPago: DiaPago | null | undefined, fechaISO: string): boolean {
  if (!diaPago) return false;
  const fecha = new Date(fechaISO + 'T00:00:00');

  if (diaPago.frecuencia === 'mensual') return fecha.getDate() === diaValidoDelMes(fecha, diaPago.dia);
  if (diaPago.frecuencia === 'semanal') return fecha.getDay() === diaPago.dia;

  // Quincenal: se repite cada N días (editable: 11, 12, 13, 14...) desde una
  // fecha de referencia elegida por el usuario — no asume un ciclo fijo.
  if (!diaPago.fecha_referencia || !diaPago.intervalo_dias) return false;
  const referencia = new Date(diaPago.fecha_referencia + 'T00:00:00');
  const dias = Math.round((fecha.getTime() - referencia.getTime()) / 86400000);
  return dias >= 0 && dias % diaPago.intervalo_dias === 0;
}

export function formatearDiaPago(diaPago: DiaPago | null | undefined): string {
  if (!diaPago) return '';
  if (diaPago.frecuencia === 'mensual') return `Día ${diaPago.dia} de cada mes`;
  if (diaPago.frecuencia === 'semanal') return `Semanal · todos los ${DIA_SEMANA_LABEL[diaPago.dia] || ''}`;
  if (!diaPago.fecha_referencia || !diaPago.intervalo_dias) return 'Quincenal · falta configurar';
  return `Cada ${diaPago.intervalo_dias} días desde el ${fmtDate(diaPago.fecha_referencia)}`;
}
