import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control Financiero — Ser Humano",
  description: "Instituto/Clínica Ser Humano · Control financiero",
};

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
