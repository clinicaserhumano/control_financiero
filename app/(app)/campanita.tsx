"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { obtenerNotificaciones, type Notificaciones } from "./actions";
import { money } from "@/lib/calculos";

const VACIO: Notificaciones = { pagosHoy: [], pendientesCount: 0, pendientesTotal: 0 };

export default function Campanita() {
  const [datos, setDatos] = useState<Notificaciones>(VACIO);
  const [abierta, setAbierta] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    obtenerNotificaciones().then(setDatos).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierta(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const totalAvisos = datos.pagosHoy.length + (datos.pendientesCount > 0 ? 1 : 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="relative btn-ghost btn-sm !px-2.5"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {totalAvisos > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--color-danger)] text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] leading-[16px] text-center px-1">
            {totalAvisos}
          </span>
        )}
      </button>
      {abierta && (
        <div className="absolute right-0 mt-2 w-[300px] bg-[var(--color-surface)] text-ink rounded-[10px] shadow-lg border border-border z-50 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border font-bold text-[13px]">Notificaciones</div>
          <div className="max-h-[320px] overflow-y-auto">
            {totalAvisos === 0 ? (
              <div className="px-3.5 py-4 text-[12.5px] text-muted text-center">Sin notificaciones</div>
            ) : (
              <>
                {datos.pagosHoy.map((p) => (
                  <Link
                    key={p.id}
                    href={`/terceros/${p.id}`}
                    onClick={() => setAbierta(false)}
                    className="block px-3.5 py-2.5 text-[12.5px] border-b border-border hover:bg-[var(--color-surface-2)]"
                  >
                    Hoy hay que pagarle a <b>{p.nombre}</b>
                  </Link>
                ))}
                {datos.pendientesCount > 0 && (
                  <Link
                    href="/cuentas-por-pagar"
                    onClick={() => setAbierta(false)}
                    className="block px-3.5 py-2.5 text-[12.5px] hover:bg-[var(--color-surface-2)]"
                  >
                    Tienes {datos.pendientesCount} cuenta(s) por pagar pendiente(s) · {money(datos.pendientesTotal)}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
