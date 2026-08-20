"use client";

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
];

const TAB_USUARIOS = { href: "/usuarios", label: "Usuarios", match: (p: string) => p.startsWith("/usuarios") };

export default function NavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") || "";
  const esAdmin = useEsAdmin();
  const tabs = esAdmin ? [...TABS, TAB_USUARIOS] : TABS;

  return (
    <nav className="flex gap-0.5 bg-carbon-2 px-3.5 overflow-x-auto">
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
    </nav>
  );
}
