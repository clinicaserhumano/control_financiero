import type { Metadata } from "next";
import "./globals.css";
import { obtenerConfiguracion } from "@/lib/configuracion";
import { oscurecer, aclarar, esHexValido } from "@/lib/color";
import { cssTemaOscuro, esTemaOscuroValido, TEMA_OSCURO_POR_DEFECTO } from "@/lib/temas-oscuros";

export async function generateMetadata(): Promise<Metadata> {
  const configuracion = await obtenerConfiguracion();
  return {
    title: configuracion.nombre_empresa,
    description: `${configuracion.nombre_empresa} · Control financiero`,
  };
}

// Se aplica antes del primer paint para que no haya parpadeo claro→oscuro
// al cargar la página (localStorage no está disponible durante el render
// del servidor, así que esto tiene que correr en el cliente lo antes posible).
const SCRIPT_TEMA = `
try {
  if (localStorage.getItem('tema') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const configuracion = await obtenerConfiguracion();
  const colorPrimario = esHexValido(configuracion.color_primario) ? configuracion.color_primario : "#fc6b12";
  const colorHeader = esHexValido(configuracion.color_header) ? configuracion.color_header : "#2b2420";
  // Sobreescribe, con la misma especificidad (:root), los colores fijos que
  // trae globals.css — al ir después en el documento, gana la cascada. Así
  // Configuración cambia el tema de marca en toda la app sin tocar CSS.
  // En modo claro, la barra de arriba usa "Color principal" (var(--color-header)
  // = var(--color-primary), definido así en globals.css) y "Color del
  // encabezado" pinta el menú de módulos de abajo y los botones oscuros
  // (--color-carbon). En modo oscuro, el tema oscuro elegido manda sobre
  // ambos (ver cssTemaOscuro) — por eso acá NO se fija --color-header.
  const ESTILO_MARCA = `:root {
    --color-primary: ${colorPrimario};
    --color-primary-dark: ${oscurecer(colorPrimario, 0.15)};
    --color-amber: ${aclarar(colorPrimario, 0.22)};
    --color-carbon: ${colorHeader};
    --color-carbon-2: ${aclarar(colorHeader, 0.12)};
  }`;
  const temaOscuroId = esTemaOscuroValido(configuracion.tema_oscuro) ? configuracion.tema_oscuro : TEMA_OSCURO_POR_DEFECTO;
  const ESTILO_TEMA_OSCURO = cssTemaOscuro(temaOscuroId);

  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <style dangerouslySetInnerHTML={{ __html: ESTILO_MARCA }} />
        <style dangerouslySetInnerHTML={{ __html: ESTILO_TEMA_OSCURO }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
