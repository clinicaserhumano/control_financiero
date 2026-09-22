// Cálculos puros para el módulo Dashboard — todo de solo lectura, ninguna
// función de acá escribe en la base. Reciben movimientos ya traídos (con sus
// relaciones embebidas) y devuelven los datos ya listos para graficar.

import { TERCERO_TIPO_LABEL, nombreCompleto } from './terceros';
import type { MovimientoFinanciero, TerceroTipo } from './types';

export type MovDashboard = Pick<
  MovimientoFinanciero,
  'tipo' | 'estado' | 'monto' | 'fecha' | 'pagador' | 'beneficiario' | 'razon_egreso'
> & {
  tercero: { tipo: TerceroTipo; nombre: string; apellido: string | null } | null;
  tipo_movimiento: { nombre: string } | null;
};

const MES_LABEL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Enumera los meses 'YYYY-MM' entre desde y hasta (inclusive), para que un mes
// sin movimientos también aparezca en el gráfico como 0 en vez de desaparecer.
function mesesEntre(desde: string, hasta: string): string[] {
  const meses: string[] = [];
  let [y, m] = [Number(desde.slice(0, 4)), Number(desde.slice(5, 7))];
  const [yFin, mFin] = [Number(hasta.slice(0, 4)), Number(hasta.slice(5, 7))];
  while (y < yFin || (y === yFin && m <= mFin)) {
    meses.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return meses;
}

function etiquetaMes(mesISO: string): string {
  const [y, m] = mesISO.split('-').map(Number);
  return `${MES_LABEL[m - 1]} ${String(y).slice(2)}`;
}

export type PuntoMensual = { mes: string; label: string; ingresos: number; egresos: number };

export function tendenciaMensual(movimientos: MovDashboard[], desde: string, hasta: string): PuntoMensual[] {
  const porMes = new Map<string, { ingresos: number; egresos: number }>();
  for (const mes of mesesEntre(desde, hasta)) porMes.set(mes, { ingresos: 0, egresos: 0 });

  for (const m of movimientos) {
    if (m.estado !== 'confirmado') continue;
    const mes = m.fecha.slice(0, 7);
    const acc = porMes.get(mes);
    if (!acc) continue; // fuera del rango pedido
    if (m.tipo === 'ingreso') acc.ingresos += Number(m.monto || 0);
    else acc.egresos += Number(m.monto || 0);
  }

  return [...porMes.entries()].map(([mes, v]) => ({ mes, label: etiquetaMes(mes), ...v }));
}

export type Barra = { etiqueta: string; total: number };

// Categoría de un egreso: si tiene Personal asociado, su tipo (Proveedor,
// Servicios prestados, Personal afiliado); si no, su razón de gasto
// (Luz/Agua/Internet) o "Otros gastos" si quedó como texto libre o vacío.
function categoriaEgreso(m: MovDashboard): string {
  if (m.tercero) return TERCERO_TIPO_LABEL[m.tercero.tipo];
  if (m.razon_egreso === 'Luz' || m.razon_egreso === 'Agua' || m.razon_egreso === 'Internet') return m.razon_egreso;
  return 'Otros gastos';
}

// Mismo orden en el que se muestran en Configuración/Dashboard — coincide
// con el check constraint de la tabla presupuestos.
export const CATEGORIAS_PRESUPUESTO = [
  'Proveedor',
  'Servicios prestados',
  'Personal afiliado',
  'Luz',
  'Agua',
  'Internet',
  'Otros gastos',
] as const;

export function egresosPorCategoria(movimientos: MovDashboard[]): Barra[] {
  const porCategoria = new Map<string, number>();
  for (const m of movimientos) {
    if (m.tipo !== 'egreso' || m.estado !== 'confirmado') continue;
    const cat = categoriaEgreso(m);
    porCategoria.set(cat, (porCategoria.get(cat) || 0) + Number(m.monto || 0));
  }
  return [...porCategoria.entries()]
    .map(([etiqueta, total]) => ({ etiqueta, total }))
    .sort((a, b) => b.total - a.total);
}

export function egresosPorFormaPago(movimientos: MovDashboard[]): Barra[] {
  const porForma = new Map<string, number>();
  for (const m of movimientos) {
    if (m.tipo !== 'egreso' || m.estado !== 'confirmado') continue;
    const forma = m.tipo_movimiento?.nombre || 'Sin especificar';
    porForma.set(forma, (porForma.get(forma) || 0) + Number(m.monto || 0));
  }
  return [...porForma.entries()]
    .map(([etiqueta, total]) => ({ etiqueta, total }))
    .sort((a, b) => b.total - a.total);
}

export function topBeneficiarios(movimientos: MovDashboard[], n = 10): Barra[] {
  const porBeneficiario = new Map<string, number>();
  for (const m of movimientos) {
    if (m.tipo !== 'egreso' || m.estado !== 'confirmado') continue;
    const nombre = m.tercero ? nombreCompleto(m.tercero) : m.beneficiario || 'Sin especificar';
    porBeneficiario.set(nombre, (porBeneficiario.get(nombre) || 0) + Number(m.monto || 0));
  }
  return [...porBeneficiario.entries()]
    .map(([etiqueta, total]) => ({ etiqueta, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

// Gasto confirmado del mes indicado (YYYY-MM), agrupado por categoría —
// independiente del filtro de fechas del Dashboard, porque un presupuesto
// siempre es "este mes calendario", no un rango elegido a mano.
export function gastoDelMesPorCategoria(movimientos: MovDashboard[], mesISO: string): Map<string, number> {
  const porCategoria = new Map<string, number>();
  for (const m of movimientos) {
    if (m.tipo !== 'egreso' || m.estado !== 'confirmado') continue;
    if (m.fecha.slice(0, 7) !== mesISO) continue;
    const cat = categoriaEgreso(m);
    porCategoria.set(cat, (porCategoria.get(cat) || 0) + Number(m.monto || 0));
  }
  return porCategoria;
}

export type Antiguedad = { etiqueta: string; total: number; cantidad: number };

// Egresos pendientes agrupados por cuántos días lleva cada uno esperando
// pago, contados desde su fecha hasta hoy — para priorizar qué pagar primero,
// no solo cuánto se debe en total.
export function pendientesPorAntiguedad(movimientos: MovDashboard[], hoyISO: string): Antiguedad[] {
  const hoy = new Date(hoyISO + 'T00:00:00');
  const rangos: Antiguedad[] = [
    { etiqueta: '0-7 días', total: 0, cantidad: 0 },
    { etiqueta: '8-15 días', total: 0, cantidad: 0 },
    { etiqueta: '16-30 días', total: 0, cantidad: 0 },
    { etiqueta: 'Más de 30 días', total: 0, cantidad: 0 },
  ];
  for (const m of movimientos) {
    if (m.tipo !== 'egreso' || m.estado !== 'pendiente') continue;
    const dias = Math.floor((hoy.getTime() - new Date(m.fecha + 'T00:00:00').getTime()) / 86_400_000);
    const rango = dias <= 7 ? rangos[0] : dias <= 15 ? rangos[1] : dias <= 30 ? rangos[2] : rangos[3];
    rango.total += Number(m.monto || 0);
    rango.cantidad += 1;
  }
  return rangos;
}
