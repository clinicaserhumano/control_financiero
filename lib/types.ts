// Tipos reflejando el esquema de Supabase (ver DOCS para el SQL original).

export type TerceroTipo = 'empleado' | 'proveedor' | 'afiliado' | 'paciente_cliente' | 'otro';

export type MovimientoTipo = 'ingreso' | 'egreso';
export type MovimientoEstado = 'pendiente' | 'confirmado' | 'anulado';

export interface Cuenta {
  id: string;
  empresa: string;
  ruc: string;
  banco: string;
  tipo: string;
  numero: string;
  elaborado: string | null;
  aprobado: string | null;
  creado_en: string;
}

export interface HorarioDia {
  dia: string;
  entrada: string;
  salida: string;
}

// dia: día de la semana (0=Domingo..6=Sábado) si frecuencia es 'semanal', o
// día del mes (1-31) si es 'mensual'. Se ignora si es 'quincenal'.
// intervalo_dias / fecha_referencia: solo para 'quincenal' — cada cuántos
// días se repite (editable: 11, 12, 13, 14...) y la fecha (AAAA-MM-DD) del
// próximo pago, para casos que no caen justo cada 14/15 días exactos.
export interface DiaPago {
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
  dia: number;
  intervalo_dias: number | null;
  fecha_referencia: string | null;
}

export interface Tercero {
  id: string;
  tipo: TerceroTipo;
  nombre: string;
  apellido: string | null;
  cedula_ruc: string | null;
  tarea: string | null;
  cuenta_id: string | null;
  sueldo: number | null;
  horas: number | null;
  precio_hora: number | null;
  activo: boolean;
  horario: HorarioDia[];
  dia_pago: DiaPago | null;
  creado_en: string;
}

export interface CampoExtra {
  clave: string;
  etiqueta: string;
  requerido: boolean;
  tipo?: 'text' | 'number' | 'date';
}

export interface TipoMovimiento {
  id: string;
  direccion: MovimientoTipo;
  nombre: string;
  campos_extra: CampoExtra[];
  activo: boolean;
  orden: number;
  requiere_cuenta: boolean;
}

export interface MovimientoFinanciero {
  id: string;
  fecha: string;
  fecha_pago: string | null;
  tipo: MovimientoTipo;
  tipo_movimiento_id: string | null;
  cuenta_id: string | null;
  tercero_id: string | null;
  monto: number;
  estado: MovimientoEstado;
  concepto: string | null;
  referencia: Record<string, string>;
  origen: string | null;
  vinculo_id: string | null;
  creado_por: string | null;
  creado_en: string;
  // Descuento aplicado al momento de pagar (egresos): `monto` ya queda neto
  // (lo que realmente salió de la cuenta); `descuento` es el valor
  // informativo de cuánto se descontó del monto original adeudado.
  descuento: number | null;
  observaciones: string | null;
  // Ingresos: nombre libre de quién paga (paciente/cliente). No usan
  // tercero_id porque en esta clínica siempre pagan antes de la consulta —
  // nunca queda un saldo por cobrar que justifique una ficha propia.
  pagador: string | null;
  // Egresos: nombre libre de a favor de quién (compra puntual, proveedor no
  // registrado en Personal). Independiente de tercero_id, no lo reemplaza.
  beneficiario: string | null;
  // Egresos: categoría del gasto (Luz/Agua/Internet/texto libre si "Otros").
  // No es forma de pago — es la razón del gasto, un eje aparte.
  razon_egreso: string | null;
}

export interface DiaSemana {
  dia: string;
  fecha: string;
  entrada: string;
  salida: string;
  almuerzo: string;
  nota: string;
}

export interface Semana {
  id: string;
  tercero_id: string;
  etiqueta: string | null;
  dias: DiaSemana[];
  movimiento_id: string | null;
}

// ---- Tipos "join" usados en vistas ----

export interface MovimientoConRelaciones extends MovimientoFinanciero {
  cuenta: Cuenta | null;
  tercero: Tercero | null;
  tipo_movimiento: TipoMovimiento | null;
}

export type NotaColor = 'amarillo' | 'rosado' | 'celeste' | 'verde' | 'naranja';
export type NotaRepetir = 'ninguno' | 'diario' | 'semanal' | 'mensual';

// "fecha" es siempre la PRÓXIMA fecha en que debe avisar. Cuando `repetir`
// no es 'ninguno', la aplicación la adelanta sola cada vez que se cumple
// (ver lib/notas.ts), en vez de crear una fila nueva por cada ocurrencia.
export interface NotaRecordatorio {
  fecha: string;
  hora: string | null;
  repetir: NotaRepetir;
}

export interface Nota {
  id: string;
  titulo: string;
  contenido: string | null;
  color: NotaColor;
  recordatorio: NotaRecordatorio | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}
