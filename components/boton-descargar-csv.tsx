"use client";

type Fila = Record<string, string | number | null | undefined>;
type Columna = { clave: string; etiqueta: string };

function escaparCSV(valor: string): string {
  if (/[",\n;]/.test(valor)) return '"' + valor.replace(/"/g, '""') + '"';
  return valor;
}

export function filasACSV(columnas: Columna[], filas: Fila[]): string {
  const encabezado = columnas.map((c) => escaparCSV(c.etiqueta)).join(",");
  const cuerpo = filas.map((f) => columnas.map((c) => escaparCSV(String(f[c.clave] ?? ""))).join(",")).join("\n");
  // ﻿ (BOM): sin esto, Excel en Windows abre tildes/ñ como caracteres
  // corruptos aunque el archivo esté en UTF-8 correcto.
  return "﻿" + encabezado + "\n" + cuerpo;
}

// Botón genérico de exportar a CSV — se abre directo en Excel/Google Sheets,
// sin depender de ninguna librería nueva para generar un .xlsx real. Recibe
// las filas ya calculadas por la pantalla que lo usa (Dashboard, Reportes,
// Cuentas por Pagar, Movimientos, etc.), no vuelve a consultar nada.
export default function BotonDescargarCSV({
  nombreArchivo,
  columnas,
  filas,
  className = "btn-ghost btn-sm",
  children,
}: {
  nombreArchivo: string;
  columnas: Columna[];
  filas: Fila[];
  className?: string;
  children?: React.ReactNode;
}) {
  function descargar() {
    const csv = filasACSV(columnas, filas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={descargar} className={className} disabled={filas.length === 0}>
      {children || "⬇️ Descargar CSV"}
    </button>
  );
}
