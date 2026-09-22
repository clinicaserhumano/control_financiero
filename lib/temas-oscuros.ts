// Paletas del modo oscuro, seleccionables desde Configuración. El resto de
// variables de marca (--color-primary, --color-carbon del encabezado, etc.)
// ya se configuran aparte — esto solo cubre la paleta neutra de fondo/texto
// que se ve cuando alguien activa el modo oscuro (🌙 en el encabezado).

export type TemaOscuroId = "carbon" | "negro" | "azul_marino";

export const TEMA_OSCURO_POR_DEFECTO: TemaOscuroId = "carbon";

type PaletaOscura = {
  nombre: string;
  descripcion: string;
  paper: string;
  surface: string;
  surface2: string;
  border: string;
  border2: string;
  ink: string;
  muted: string;
  emptyTitle: string;
  ghostBg: string;
  ghostBgHover: string;
  inputBg: string;
  letrasBg: string;
  pillBg: string;
};

export const TEMAS_OSCUROS: Record<TemaOscuroId, PaletaOscura> = {
  carbon: {
    nombre: "Carbón",
    descripcion: "El tema oscuro actual — marrón/negro cálido.",
    paper: "#18140f",
    surface: "#221c17",
    surface2: "#2a231d",
    border: "#3d332c",
    border2: "#362e27",
    ink: "#ede6dd",
    muted: "#a89d90",
    emptyTitle: "#cfc6bb",
    ghostBg: "#2e2822",
    ghostBgHover: "#39322a",
    inputBg: "#221c17",
    letrasBg: "#221c17",
    pillBg: "#1e2e29",
  },
  negro: {
    nombre: "Negro intenso",
    descripcion: "Negro puro, alto contraste.",
    paper: "#000000",
    surface: "#121212",
    surface2: "#1a1a1a",
    border: "#2e2e2e",
    border2: "#242424",
    ink: "#f2f2f2",
    muted: "#9e9e9e",
    emptyTitle: "#d4d4d4",
    ghostBg: "#1c1c1c",
    ghostBgHover: "#262626",
    inputBg: "#121212",
    letrasBg: "#121212",
    pillBg: "#161616",
  },
  azul_marino: {
    nombre: "Azul marino oscuro",
    descripcion: "Azul noche profundo.",
    paper: "#0a1128",
    surface: "#111d3d",
    surface2: "#16244a",
    border: "#29396b",
    border2: "#1f2f5c",
    ink: "#e8ecf7",
    muted: "#98a4c4",
    emptyTitle: "#c7d0ea",
    ghostBg: "#16244a",
    ghostBgHover: "#1d2f5c",
    inputBg: "#111d3d",
    letrasBg: "#111d3d",
    pillBg: "#142650",
  },
};

export function esTemaOscuroValido(valor: string): valor is TemaOscuroId {
  return valor in TEMAS_OSCUROS;
}

// Bloque CSS que sobreescribe html.dark { ... } de globals.css con la
// paleta elegida — misma especificidad, gana por ir después en el documento.
// En modo oscuro, TODA la pantalla sigue el tema elegido, incluido el
// encabezado y el menú de módulos (--color-header/--color-carbon*) — a
// diferencia del modo claro, donde esos dos los maneja Configuración aparte.
export function cssTemaOscuro(id: TemaOscuroId): string {
  const p = TEMAS_OSCUROS[esTemaOscuroValido(id) ? id : TEMA_OSCURO_POR_DEFECTO];
  return `html.dark {
    --color-header: ${p.paper};
    --color-carbon: ${p.surface};
    --color-carbon-2: ${p.surface2};
    --color-paper: ${p.paper};
    --color-surface: ${p.surface};
    --color-surface-2: ${p.surface2};
    --color-border: ${p.border};
    --color-border-2: ${p.border2};
    --color-ink: ${p.ink};
    --color-muted: ${p.muted};
    --color-empty-title: ${p.emptyTitle};
    --color-ghost-bg: ${p.ghostBg};
    --color-ghost-bg-hover: ${p.ghostBgHover};
    --color-input-bg: ${p.inputBg};
    --color-letras-bg: ${p.letrasBg};
    --color-pill-bg: ${p.pillBg};
  }`;
}
