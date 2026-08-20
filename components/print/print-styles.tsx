// Estilos de impresión portados del prototipo de referencia (DOCS/Control_Egresos_Cheques.html):
// A5 vertical para papeletas/comprobantes, A4 para reportes; encabezado con
// línea de acento de 3px (sin franjas de fondo oscuro), tablas solo con
// bordes (nunca celdas con relleno sólido) para no gastar tinta al imprimir.
export default function PrintStyles({ tamano }: { tamano: "A5" | "A4" }) {
  const margen = tamano === "A5" ? "10mm" : "14mm";
  return (
    <style>{`
      @page { size: ${tamano} portrait; margin: ${margen}; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { margin: 0; }
      .hoja { font-family: Arial, Helvetica, sans-serif; color: #2B2420; font-size: 11px; }
      @media screen {
        .hoja { max-width: ${tamano === "A5" ? "148mm" : "210mm"}; margin: 24px auto; background: #fff;
          padding: 16px; border: 1px solid #E4E2D9; box-shadow: 0 4px 24px rgba(43,36,32,.08); }
      }
      .no-imprimir { }
      @media print { .no-imprimir { display: none !important; } }

      .logo-print { height: 30px; width: auto; display: block; margin-bottom: 8px; }

      .hd { border-bottom: 3px solid #FDB44B; padding-bottom: 8px; margin-bottom: 14px;
        display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
      .hd .org { font-size: 14px; font-weight: 800; color: #2B2420; letter-spacing: .3px; }
      .hd .ttl { font-size: 18px; font-weight: 800; }
      .hd .ruc, .hd .bank, .hd .meta { font-size: 10px; color: #6B7280; margin-top: 2px; }
      .hd .doc { text-align: right; white-space: nowrap; }
      .hd .doc .t { font-size: 9px; color: #FDB44B; font-weight: 700; letter-spacing: 1px; }
      .hd .doc .n { font-size: 18px; font-weight: 800; line-height: 1.2; color: #2B2420; }
      .badge { display: inline-block; border: 1px solid #2B2420; color: #2B2420; font-size: 10px;
        padding: 2px 8px; border-radius: 4px; margin-top: 6px; font-weight: 700; }

      table.meta { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      table.meta td { padding: 5px 7px; border: 1px solid #c9cdd8; vertical-align: top; }
      .lbl { font-size: 8.5px; text-transform: uppercase; letter-spacing: .5px; color: #6B7280; font-weight: 700; display: block; margin-bottom: 1px; }
      .v { font-size: 12px; font-weight: 600; }
      .valbox { background: #f6f5f0; }
      .valbig { font-size: 16px; font-weight: 800; font-family: 'Courier New', monospace; }
      .letras { font-size: 10px; font-style: italic; color: #33415c; }

      .firmas { display: flex; gap: 14px; margin-top: 24px; padding-top: 4px; }
      .firma { flex: 1; text-align: center; font-size: 9px; }
      .firma .line { border-top: 1px solid #2B2420; margin: 0 6px 3px; padding-top: 3px; }
      .firma .role { color: #6B7280; }
      .firma .name { font-weight: 700; min-height: 12px; }

      table.reporte { width: 100%; border-collapse: collapse; margin-top: 6px; }
      table.reporte th { background: #fff; color: #2B2420; font-size: 9.5px; text-transform: uppercase;
        letter-spacing: .4px; padding: 7px 8px; text-align: left; border-bottom: 2px solid #2B2420; }
      table.reporte td { padding: 6px 8px; border-bottom: 1px solid #e4e2d9; font-size: 10.5px; vertical-align: top; }
      table.reporte.detalle-mov { table-layout: fixed; }
      table.reporte.detalle-mov td, table.reporte.detalle-mov th { overflow-wrap: break-word; word-break: break-word; }
      tr.grupo td { background: #f6f5f0; font-weight: 800; font-size: 11px; padding-top: 9px; padding-bottom: 9px; border-bottom: 1px solid #2B2420; }
      .rt { text-align: right; font-family: 'Courier New', monospace; white-space: nowrap; }
      tr.total td { background: #fff; color: #2B2420; font-weight: 800; font-size: 12px; border-top: 2px solid #2B2420; border-bottom: none; }

      .sum { display: flex; gap: 22px; margin: 10px 0 4px; font-size: 11px; flex-wrap: wrap; }
      .sum b { display: block; font-size: 14px; }
      .foot { margin-top: 12px; font-size: 9px; color: #9aa1ad; display: flex; justify-content: space-between; }
    `}</style>
  );
}
