// Utilidades de color para la marca configurable (Configuración): solo se
// pide un color principal y un color de encabezado — las variantes más
// oscuras/claras que el resto del sistema necesita (hover de botones, etc.)
// se derivan aquí matemáticamente, para no pedir 5 colores distintos.

export function esHexValido(valor: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(valor.trim());
}

function normalizar(hex: string): string {
  return hex.trim().startsWith('#') ? hex.trim() : `#${hex.trim()}`;
}

// mezcla el color hacia negro (factor 0-1) o hacia blanco (factor negativo).
function mezclar(hex: string, factor: number): string {
  const h = normalizar(hex);
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const hacia = factor >= 0 ? 0 : 255;
  const f = Math.abs(factor);
  const mezclarCanal = (c: number) => Math.round(c + (hacia - c) * f);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(mezclarCanal(r))}${toHex(mezclarCanal(g))}${toHex(mezclarCanal(b))}`;
}

export function oscurecer(hex: string, factor = 0.15): string {
  return mezclar(hex, factor);
}

export function aclarar(hex: string, factor = 0.15): string {
  return mezclar(hex, -factor);
}
