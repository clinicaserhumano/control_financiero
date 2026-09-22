"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { buscarGlobal, type ResultadoBusqueda } from "@/app/(app)/buscar-global-actions";

const ICONO: Record<ResultadoBusqueda["tipo"], string> = {
  personal: "👤",
  movimiento: "💵",
  cuenta: "🏦",
};

// Buscador global (Ctrl/Cmd+K): busca en Personal, Movimientos y Cuentas a
// la vez, sin tener que saber de antemano en qué módulo está lo que se
// busca. Overlay simple, no un componente de librería — coherente con el
// resto de popovers de la app (campanita, InfoBoton).
export default function BuscadorGlobal() {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cerrar() {
    setAbierto(false);
    setQuery("");
    setResultados([]);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto(true);
      } else if (e.key === "Escape") {
        cerrar();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [abierto]);

  function onChange(valor: string) {
    setQuery(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.trim().length < 2) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await buscarGlobal(valor);
        setResultados(r);
      });
    }, 300);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="btn-ghost btn-sm !px-2.5"
        title="Buscar (Ctrl+K)"
        aria-label="Buscar"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[12vh] px-4"
          onClick={cerrar}
        >
          <div
            className="w-full max-w-[520px] rounded-[12px] border border-border bg-surface shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Buscar Personal, movimientos, cuentas…"
              className="w-full px-4 py-3.5 text-[14px] outline-none bg-transparent text-ink border-b border-border"
            />
            <div className="max-h-[360px] overflow-y-auto">
              {buscando && <div className="px-4 py-3 text-[12px] text-muted">Buscando…</div>}
              {!buscando && query.trim().length >= 2 && resultados.length === 0 && (
                <div className="px-4 py-4 text-[12.5px] text-muted">Sin resultados para &quot;{query}&quot;.</div>
              )}
              {!buscando &&
                resultados.map((r) => (
                  <Link
                    key={`${r.tipo}-${r.id}`}
                    href={r.href}
                    onClick={cerrar}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--color-surface-2)] border-b border-border-2 last:border-0"
                  >
                    <span className="text-[15px]">{ICONO[r.tipo]}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">{r.titulo}</div>
                      <div className="text-[11px] text-muted truncate">{r.subtitulo}</div>
                    </div>
                  </Link>
                ))}
            </div>
            <div className="px-4 py-2 text-[10.5px] text-muted border-t border-border">Esc para cerrar</div>
          </div>
        </div>
      )}
    </>
  );
}
