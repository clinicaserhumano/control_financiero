// Tipado mínimo de las tablas de Supabase para los clientes tipados.
// Refleja el esquema SQL ya aplicado (ver DOCS/Control_Egresos_Cheques.html para contexto histórico).
// La forma (Row/Insert/Update/Relationships, Views, Functions) es la que exige
// @supabase/postgrest-js para poder tipar selects embebidos (foo:tabla(...)).

export interface Database {
  public: {
    Tables: {
      cuentas: {
        Row: {
          id: string;
          empresa: string;
          ruc: string;
          banco: string;
          tipo: string;
          numero: string;
          elaborado: string | null;
          aprobado: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          empresa: string;
          ruc: string;
          banco: string;
          tipo?: string;
          numero: string;
          elaborado?: string | null;
          aprobado?: string | null;
          creado_en?: string;
        };
        Update: Partial<Database['public']['Tables']['cuentas']['Insert']>;
        Relationships: [];
      };
      terceros: {
        Row: {
          id: string;
          tipo: 'empleado' | 'proveedor' | 'afiliado' | 'paciente_cliente' | 'otro';
          nombre: string;
          apellido: string | null;
          cedula_ruc: string | null;
          tarea: string | null;
          cuenta_id: string | null;
          sueldo: number | null;
          horas: number | null;
          precio_hora: number | null;
          activo: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          tipo: 'empleado' | 'proveedor' | 'afiliado' | 'paciente_cliente' | 'otro';
          nombre: string;
          apellido?: string | null;
          cedula_ruc?: string | null;
          tarea?: string | null;
          cuenta_id?: string | null;
          sueldo?: number | null;
          horas?: number | null;
          precio_hora?: number | null;
          activo?: boolean;
          creado_en?: string;
        };
        Update: Partial<Database['public']['Tables']['terceros']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'terceros_cuenta_id_fkey';
            columns: ['cuenta_id'];
            isOneToOne: false;
            referencedRelation: 'cuentas';
            referencedColumns: ['id'];
          },
        ];
      };
      tipos_movimiento: {
        Row: {
          id: string;
          direccion: 'ingreso' | 'egreso';
          nombre: string;
          campos_extra: { clave: string; etiqueta: string; requerido: boolean; tipo?: string }[];
          activo: boolean;
          orden: number;
        };
        Insert: {
          id?: string;
          direccion: 'ingreso' | 'egreso';
          nombre: string;
          campos_extra?: { clave: string; etiqueta: string; requerido: boolean; tipo?: string }[];
          activo?: boolean;
          orden?: number;
        };
        Update: Partial<Database['public']['Tables']['tipos_movimiento']['Insert']>;
        Relationships: [];
      };
      movimientos_financieros: {
        Row: {
          id: string;
          fecha: string;
          fecha_pago: string | null;
          tipo: 'ingreso' | 'egreso';
          tipo_movimiento_id: string | null;
          cuenta_id: string | null;
          tercero_id: string | null;
          monto: number;
          estado: 'pendiente' | 'confirmado' | 'anulado';
          concepto: string | null;
          referencia: Record<string, string>;
          origen: string | null;
          vinculo_id: string | null;
          creado_por: string | null;
          creado_en: string;
          descuento: number | null;
          observaciones: string | null;
        };
        Insert: {
          id?: string;
          fecha: string;
          fecha_pago?: string | null;
          tipo: 'ingreso' | 'egreso';
          tipo_movimiento_id?: string | null;
          cuenta_id?: string | null;
          tercero_id?: string | null;
          monto: number;
          estado?: 'pendiente' | 'confirmado' | 'anulado';
          concepto?: string | null;
          referencia?: Record<string, string>;
          origen?: string | null;
          vinculo_id?: string | null;
          creado_por?: string | null;
          creado_en?: string;
          descuento?: number | null;
          observaciones?: string | null;
        };
        Update: Partial<Database['public']['Tables']['movimientos_financieros']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'movimientos_financieros_cuenta_id_fkey';
            columns: ['cuenta_id'];
            isOneToOne: false;
            referencedRelation: 'cuentas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'movimientos_financieros_tercero_id_fkey';
            columns: ['tercero_id'];
            isOneToOne: false;
            referencedRelation: 'terceros';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'movimientos_financieros_tipo_movimiento_id_fkey';
            columns: ['tipo_movimiento_id'];
            isOneToOne: false;
            referencedRelation: 'tipos_movimiento';
            referencedColumns: ['id'];
          },
        ];
      };
      semanas: {
        Row: {
          id: string;
          tercero_id: string;
          etiqueta: string | null;
          dias: { dia: string; fecha: string; entrada: string; salida: string; almuerzo: string; nota: string }[];
          movimiento_id: string | null;
        };
        Insert: {
          id?: string;
          tercero_id: string;
          etiqueta?: string | null;
          dias?: { dia: string; fecha: string; entrada: string; salida: string; almuerzo: string; nota: string }[];
          movimiento_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['semanas']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'semanas_tercero_id_fkey';
            columns: ['tercero_id'];
            isOneToOne: false;
            referencedRelation: 'terceros';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'semanas_movimiento_id_fkey';
            columns: ['movimiento_id'];
            isOneToOne: false;
            referencedRelation: 'movimientos_financieros';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
