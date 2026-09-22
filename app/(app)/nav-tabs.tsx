"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEsAdmin } from "@/lib/auth/role-context";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", match: (p: string) => p.startsWith("/dashboard") },
  { href: "/cuentas", label: "Cuentas", icon: "🏦", match: (p: string) => p.startsWith("/cuentas") && !p.startsWith("/cuentas-por-pagar") },
  { href: "/terceros", label: "Personal", icon: "👤", match: (p: string) => p.startsWith("/terceros") },
  { href: "/movimientos?tipo=ingreso", label: "Ingresos", icon: "💰", match: (p: string, q: string) => p.startsWith("/movimientos") && q === "ingreso" },
  { href: "/movimientos?tipo=egreso", label: "Egresos", icon: "💸", match: (p: string, q: string) => p.startsWith("/movimientos") && q !== "ingreso" },
  { href: "/cuentas-por-pagar", label: "Cuentas x Pagar", icon: "📋", match: (p: string) => p.startsWith("/cuentas-por-pagar") },
  { href: "/reportes", label: "Reportes", icon: "📈", match: (p: string) => p.startsWith("/reportes") },
  { href: "/notas", label: "Notas", icon: "📝", match: (p: string) => p.startsWith("/notas") },
];

const TABS_ADMIN = [
  { href: "/usuarios", label: "Usuarios", icon: "👥", match: (p: string) => p.startsWith("/usuarios") },
  { href: "/auditoria", label: "Auditoría", icon: "📜", match: (p: string) => p.startsWith("/auditoria") },
  { href: "/configuracion", label: "Configuración", icon: "⚙️", match: (p: string) => p.startsWith("/configuracion") },
];

const CLAVE_COMPACTO = "nav_compacto";

// Aparte para que el único componente que necesita useSearchParams() (y por
// lo tanto Suspense) sea este, chiquito — el resto de la barra (logo,
// compactar, Cómo usar) no depende de la ruta y no necesita esperar nada.
function NavLinks({ modoCompacto, onNavegar }: { modoCompacto: boolean; onNavegar: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") || "";
  const esAdmin = useEsAdmin();
  const tabs = esAdmin ? [...TABS, ...TABS_ADMIN] : TABS;

  return (
    <>
      {tabs.map((tab) => {
        const active = tab.match(pathname, tipo);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={onNavegar}
            title={modoCompacto ? tab.label : undefined}
            className={
              "flex items-center rounded-lg text-[13px] font-semibold transition-colors " +
              (modoCompacto
                ? "justify-center w-11 h-11 " + (active ? "bg-white/15 text-white" : "text-[#c4cee4] hover:bg-white/5 hover:text-white")
                : "gap-2.5 px-3 py-2.5 border-l-[3px] " +
                  (active ? "bg-white/10 text-white border-amber" : "text-[#c4cee4] border-transparent hover:bg-white/5 hover:text-white"))
            }
          >
            <span className="text-[15px] flex-none leading-none">{tab.icon}</span>
            {!modoCompacto && <span className="truncate">{tab.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

export default function NavTabs({
  nombreEmpresa,
  logoUrl,
  children,
}: {
  nombreEmpresa: string;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [compacto, setCompacto] = useState(false);

  useEffect(() => {
    // Sincroniza con localStorage (sistema externo al que React no tiene
    // acceso durante el render inicial) — empieza expandido para que
    // coincida con el servidor, y recién acá se ajusta si el usuario había
    // elegido compacto antes. Mismo patrón que ThemeToggle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(CLAVE_COMPACTO) === "1") setCompacto(true);
  }, []);

  function alternarCompacto() {
    setCompacto((v) => {
      const next = !v;
      try {
        localStorage.setItem(CLAVE_COMPACTO, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  function cerrarMovil() {
    setAbierto(false);
  }

  function logo(modoCompacto: boolean) {
    return (
      <div className={(modoCompacto ? "w-9 h-9" : "h-8") + " flex items-center justify-center flex-none"}>
        {logoUrl ? (
          // Logo subido por el administrador: se acota a una caja fija con
          // object-contain para que nunca se deforme, sea cual sea su
          // proporción real (a diferencia de solo poner alto fijo y ancho
          // automático, que sí se puede ver estirado si la imagen no es
          // apaisada).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={nombreEmpresa} className="max-w-full max-h-full w-auto h-auto object-contain" />
        ) : (
          <Image
            src="/logo-blanco.png"
            alt={nombreEmpresa}
            width={97}
            height={40}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
        )}
      </div>
    );
  }

  function panel(modoCompacto: boolean, esPanelMovil: boolean) {
    return (
      <>
        <div
          className={
            "border-b border-white/10 " +
            (modoCompacto ? "flex flex-col items-center gap-1.5 px-2 py-3.5" : "flex flex-col items-start gap-1.5 px-4 py-4")
          }
        >
          {logo(modoCompacto)}
          {!modoCompacto && <span className="text-[12.5px] font-bold text-white leading-tight">{nombreEmpresa}</span>}
        </div>

        <nav className={"flex-1 flex flex-col gap-0.5 py-3 overflow-y-auto " + (modoCompacto ? "px-1.5 items-center" : "px-2.5")}>
          <Suspense fallback={null}>
            <NavLinks modoCompacto={modoCompacto} onNavegar={cerrarMovil} />
          </Suspense>
        </nav>

        {!esPanelMovil && (
          <button
            type="button"
            onClick={alternarCompacto}
            title={modoCompacto ? "Expandir menú" : "Compactar menú"}
            className={
              "hidden sm:flex items-center gap-2 text-[11px] font-semibold text-[#c4cee4] hover:text-white border-t border-white/10 transition-colors " +
              (modoCompacto ? "justify-center py-2.5" : "px-4 py-2.5")
            }
          >
            <span className="text-[13px] leading-none">{modoCompacto ? "»" : "«"}</span>
            {!modoCompacto && "Compactar"}
          </button>
        )}

        <Link
          href="/ayuda"
          onClick={cerrarMovil}
          title={modoCompacto ? "Cómo usar" : undefined}
          className={
            "flex items-center text-[12px] font-semibold border-t border-white/10 transition-colors " +
            (modoCompacto ? "justify-center py-3" : "gap-2.5 px-4 py-3")
          }
        >
          <span className="text-[14px] leading-none">❔</span>
          {!modoCompacto && "Cómo usar"}
        </Link>
      </>
    );
  }

  return (
    <>
      {/* Tablet/escritorio: barra lateral FIJA (no "sticky" — así nunca se
          va con el scroll de la página, siempre pegada a la izquierda). */}
      <aside
        className={
          "hidden sm:flex sm:flex-col fixed inset-y-0 left-0 z-30 bg-carbon transition-[width] duration-150 " +
          (compacto ? "w-[64px]" : "w-[212px]")
        }
      >
        {panel(compacto, false)}
      </aside>

      {/* Móvil: botón flotante + panel deslizable desde la izquierda (siempre expandido). */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-expanded={abierto}
          aria-label="Abrir menú de módulos"
          className="fixed top-3 left-3 z-40 flex items-center justify-center w-9 h-9 rounded-lg bg-carbon text-white shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        {abierto && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={cerrarMovil} />
            <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-carbon flex flex-col shadow-lg">{panel(false, true)}</aside>
          </>
        )}
      </div>

      {/* Encabezado + contenido: el margen izquierdo compensa el ancho de la
          barra lateral fija (nada en móvil, donde la barra no ocupa espacio). */}
      <div
        className={
          "min-h-screen flex flex-col transition-[margin] duration-150 " + (compacto ? "sm:ml-[64px]" : "sm:ml-[212px]")
        }
      >
        {children}
      </div>
    </>
  );
}
