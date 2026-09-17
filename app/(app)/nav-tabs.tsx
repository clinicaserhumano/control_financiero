"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEsAdmin } from "@/lib/auth/role-context";

const TABS = [
  { href: "/cuentas", label: "Cuentas", match: (p: string) => p.startsWith("/cuentas") && !p.startsWith("/cuentas-por-pagar") },
  { href: "/terceros", label: "Personal", match: (p: string) => p.startsWith("/terceros") },
  { href: "/movimientos?tipo=ingreso", label: "Ingresos", match: (p: string, q: string) => p.startsWith("/movimientos") && q === "ingreso" },
  { href: "/movimientos?tipo=egreso", label: "Egresos", match: (p: string, q: string) => p.startsWith("/movimientos") && q !== "ingreso" },
  { href: "/cuentas-por-pagar", label: "Cuentas x Pagar", match: (p: string) => p.startsWith("/cuentas-por-pagar") },
  { href: "/reportes", label: "Reportes", match: (p: string) => p.startsWith("/reportes") },
  { href: "/notas", label: "Notas", match: (p: string) => p.startsWith("/notas") },
];

const TAB_USUARIOS = { href: "/usuarios", label: "Usuarios", match: (p: string) => p.startsWith("/usuarios") };

export default function NavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") || "";
  const esAdmin = useEsAdmin();
  const tabs = esAdmin ? [...TABS, TAB_USUARIOS] : TABS;
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra el menú al cambiar de página (clic en un módulo, o navegación
  // desde otro lado) — ajuste de estado durante el render en vez de un
  // efecto, siguiendo el patrón recomendado por React para esto.
  const [rutaPrevia, setRutaPrevia] = useState(pathname + tipo);
  if (pathname + tipo !== rutaPrevia) {
    setRutaPrevia(pathname + tipo);
    if (abierto) setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  return (
    <nav className="bg-carbon-2 relative" ref={ref}>
      {/* Tablet/escritorio: barra de pestañas horizontal de siempre. */}
      <div className="hidden sm:flex items-center gap-0.5 px-3.5 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.match(pathname, tipo);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "px-4 py-3 text-[13.5px] font-semibold border-b-[3px] whitespace-nowrap transition-colors " +
                (active ? "text-white border-amber" : "text-[#c4cee4] border-transparent hover:text-white")
              }
            >
              {tab.label}
            </Link>
          );
        })}
        <Link
          href="/ayuda"
          className={
            "ml-auto pl-4 pr-1 py-3 text-[12px] font-normal whitespace-nowrap transition-colors " +
            (pathname.startsWith("/ayuda") ? "text-primary" : "text-primary/70 hover:text-primary")
          }
        >
          Cómo usar
        </Link>
      </div>

      {/* Móvil: botón de menú hamburguesa con el módulo actual. */}
      <div className="sm:hidden flex items-center justify-between px-3.5">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label="Abrir menú de módulos"
          className="flex items-center gap-2.5 py-3 text-white text-[13.5px] font-semibold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
          Módulos
        </button>
        <Link
          href="/ayuda"
          className={
            "pl-3 py-3 text-[12px] font-normal whitespace-nowrap transition-colors " +
            (pathname.startsWith("/ayuda") ? "text-primary" : "text-primary/70 hover:text-primary")
          }
        >
          Cómo usar
        </Link>
      </div>

      {abierto && (
        <div className="sm:hidden absolute left-0 right-0 top-full bg-carbon-2 border-t border-white/10 shadow-lg z-40 flex flex-col py-1">
          {tabs.map((tab) => {
            const active = tab.match(pathname, tipo);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  "px-4 py-3 text-[13.5px] font-semibold border-l-[3px] transition-colors " +
                  (active ? "text-white border-amber bg-white/5" : "text-[#c4cee4] border-transparent hover:text-white hover:bg-white/5")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
