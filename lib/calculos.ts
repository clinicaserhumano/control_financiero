// Única fuente de verdad para cálculos financieros del sistema.
// Ninguna página debe reimplementar estas sumas: importa desde aquí.

import type { DiaSemana, MovimientoFinanciero } from './types';

/* ============================================================
   FORMATO DE NÚMEROS Y FECHAS
   ============================================================ */

export function money(n: number | null | undefined): string {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// iso: 'AAAA-MM-DD' -> 'DD/MM/AAAA'
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, delta: number): string {
  const d = new Date((iso || todayISO()) + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   NÚMERO A LETRAS (portado tal cual del prototipo de referencia)
   ============================================================ */

export function numeroALetras(cantidad: number): string {
  const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const U = (n: number) => UNIDADES[n];
  const DY = (s: string, u: number) => (u === 0 ? s : s + ' Y ' + U(u));

  function D(n: number): string {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 1) {
      return ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'][u];
    }
    if (d === 2) return u === 0 ? 'VEINTE' : 'VEINTI' + U(u);
    if (d === 3) return DY('TREINTA', u);
    if (d === 4) return DY('CUARENTA', u);
    if (d === 5) return DY('CINCUENTA', u);
    if (d === 6) return DY('SESENTA', u);
    if (d === 7) return DY('SETENTA', u);
    if (d === 8) return DY('OCHENTA', u);
    if (d === 9) return DY('NOVENTA', u);
    return U(u);
  }

  function C(n: number): string {
    const c = Math.floor(n / 100);
    const r = n % 100;
    if (c === 1) return r === 0 ? 'CIEN' : 'CIENTO ' + D(r);
    const a = ['', '', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    if (c > 0) return (a[c] + ' ' + D(r)).trim();
    return D(r);
  }

  function S(n: number, div: number, sg: string, pl: string): { l: string; r: number } {
    const ci = Math.floor(n / div);
    const r = n % div;
    let l = '';
    if (ci > 0) l = ci > 1 ? C(ci) + ' ' + pl : sg;
    return { l, r };
  }

  function Mi(n: number): string {
    const s = S(n, 1000, 'MIL', 'MIL');
    const c = C(s.r);
    return s.l === '' ? c : (s.l + ' ' + c).trim();
  }

  function Mm(n: number): string {
    const s = S(n, 1000000, 'UN MILLON', 'MILLONES');
    const m = Mi(s.r);
    return s.l === '' ? m : (s.l + ' ' + m).trim();
  }

  let ent = Math.floor(cantidad);
  let cent = Math.round((cantidad - ent) * 100);
  if (cent === 100) {
    cent = 0;
    ent += 1;
  }
  const l = ent === 0 ? 'CERO' : Mm(ent);
  return (l + ' CON ' + String(cent).padStart(2, '0') + '/100 DOLARES').replace(/\s+/g, ' ').trim();
}

/* ============================================================
   SALDOS — fuente única de verdad
   ============================================================ */

type MovParaSaldo = Pick<MovimientoFinanciero, 'tipo' | 'estado' | 'monto' | 'fecha' | 'creado_en'>;

// Único cálculo de saldo acumulado: ordena los movimientos confirmados de una
// cuenta por fecha y va sumando (ingreso) / restando (egreso). Se usa tanto
// para el saldo total de una cuenta como para el saldo fila-a-fila de su
// estado de cuenta, así nunca se desincronizan entre sí.
export function movimientosConSaldo<T extends MovParaSaldo>(movimientos: T[]): (T & { saldoAcumulado: number })[] {
  const confirmados = movimientos
    .filter((m) => m.estado === 'confirmado')
    .slice()
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.creado_en || '').localeCompare(b.creado_en || ''));

  let saldo = 0;
  return confirmados.map((m) => {
    saldo += m.tipo === 'ingreso' ? Number(m.monto || 0) : -Number(m.monto || 0);
    return { ...m, saldoAcumulado: saldo };
  });
}

// Saldo de una cuenta = ingresos confirmados - egresos confirmados.
// Recibe los movimientos de la cuenta (cualquier estado); filtra internamente.
export function saldoCuenta(movimientos: MovParaSaldo[]): number {
  const conSaldo = movimientosConSaldo(movimientos);
  return conSaldo.length ? conSaldo[conSaldo.length - 1].saldoAcumulado : 0;
}

/* ============================================================
   N° DE EGRESO POR CUENTA (portado del prototipo de referencia:
   cada cuenta lleva su propia numeración de egresos/cheques)
   ============================================================ */

type MovParaNumero = {
  id: string;
  cuenta_id: string | null;
  creado_en: string;
  referencia?: Record<string, unknown> | null;
};

// Asigna a cada egreso su N° dentro de los egresos de SU cuenta. Si el
// egreso ya trae un `referencia.numero_egreso` (el número real, migrado del
// talonario/respaldo histórico — ver DOCS), se respeta tal cual: es la
// numeración que la clínica ya usa en papel y no se puede recalcular a
// partir de la fecha de creación en la base. Los egresos sin ese dato
// (nuevos, creados directo en la app) siguen numerándose por orden de
// creación, continuando después del último número real de esa cuenta.
export function numerosEgresoPorCuenta<T extends MovParaNumero>(egresos: T[]): Map<string, number> {
  const porCuenta = new Map<string, T[]>();
  for (const m of egresos) {
    if (!m.cuenta_id) continue;
    const lista = porCuenta.get(m.cuenta_id) ?? [];
    lista.push(m);
    porCuenta.set(m.cuenta_id, lista);
  }
  const numeros = new Map<string, number>();
  for (const lista of porCuenta.values()) {
    let maxReal = 0;
    const sinNumero: T[] = [];
    for (const m of lista) {
      const real = m.referencia?.numero_egreso;
      if (typeof real === 'number') {
        numeros.set(m.id, real);
        if (real > maxReal) maxReal = real;
      } else {
        sinNumero.push(m);
      }
    }
    sinNumero
      .slice()
      .sort((a, b) => (a.creado_en || '').localeCompare(b.creado_en || ''))
      .forEach((m, i) => numeros.set(m.id, maxReal + i + 1));
  }
  return numeros;
}

export function totalPorTipoEstado(
  movimientos: MovParaSaldo[],
  tipo: MovimientoFinanciero['tipo'],
  estado?: MovimientoFinanciero['estado']
): number {
  return movimientos
    .filter((m) => m.tipo === tipo && (!estado || m.estado === estado))
    .reduce((s, m) => s + Number(m.monto || 0), 0);
}

/* ============================================================
   CONCILIACIÓN FIFO (para saldo x pagar de un tercero)
   ============================================================
   Decisión de diseño: en este esquema cada cargo (semana de bitácora,
   factura de proveedor, etc.) es su propio movimiento con estado
   'pendiente', y "Registrar pago" confirma ESE movimiento puntual
   (1 a 1) — no hay pagos parciales de un solo cargo. Aun así, cuando
   hay varios cargos pendientes acumulados para un mismo tercero, se
   muestran ordenados FIFO (el más antiguo primero) para que el pago
   siguiente sea obvio. Esta función queda lista para Fase 3 (Bitácora)
   y Fase 4 (Cuentas por pagar).
*/
export function pendientesFIFO<T extends Pick<MovimientoFinanciero, 'fecha' | 'estado'>>(cargos: T[]): T[] {
  return cargos
    .filter((c) => c.estado === 'pendiente')
    .slice()
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
}

/* ============================================================
   BITÁCORA DE NÓMINA (portado de weekTotals() del prototipo)
   ============================================================ */

// 'HH:MM' -> horas decimales. Vacío o inválido = 0.
export function horaDecimal(hhmm: string | null | undefined): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

// Horas y valor (horas × precio/hora) de una semana de bitácora.
// Un día necesita AMBAS horas (entrada y salida) para contar: si falta una,
// cuenta 0 en vez de restar contra 0 y producir un número grande y falso.
// Salida antes que entrada tampoco resta (nunca horas negativas).
export function calcularHorasSemana(dias: DiaSemana[], precioHora: number): { horas: number; valor: number } {
  const horas = dias.reduce((total, d) => {
    if (!d.entrada || !d.salida) return total;
    let h = horaDecimal(d.salida) - horaDecimal(d.entrada) - Number(d.almuerzo || 0) / 60;
    if (h < 0 || isNaN(h)) h = 0;
    return total + h;
  }, 0);
  const valor = Math.round(horas * (precioHora || 0) * 100) / 100;
  return { horas, valor };
}
