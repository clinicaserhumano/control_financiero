"use client";

import { useEffect, useRef, useState } from "react";

// Botón circular "i" que muestra una explicación express de la sección al
// hacer clic — para no obligar a nadie a ir hasta "Cómo usar" solo para
// recordar qué hace un botón. `ancla` (opcional) lleva a la sección
// correspondiente de la guía completa, si alguien quiere más detalle.
export default function InfoBoton({ titulo, ancla, children }: { titulo: string; ancla?: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [abierto]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Ayuda sobre: ${titulo}`}
        aria-expanded={abierto}
        className={
          "w-[20px] h-[20px] rounded-full border text-[11px] font-bold flex items-center justify-center transition-colors " +
          (abierto ? "bg-primary border-primary text-white" : "border-primary text-primary hover:bg-primary hover:text-white")
        }
      >
        i
      </button>
      {abierto && (
        <div className="absolute z-30 top-[26px] left-0 w-[310px] max-w-[85vw] rounded-[10px] border border-border bg-surface shadow-lg p-3.5 text-[12.5px] leading-relaxed text-ink">
          <div className="font-bold text-[13px] mb-1.5 flex items-center gap-1.5">
            <span className="text-primary">ⓘ</span> {titulo}
          </div>
          <div className="flex flex-col gap-2">{children}</div>
          {ancla && (
            <a href={`/ayuda#${ancla}`} className="text-primary-dark underline text-[11.5px] mt-2.5 inline-block font-semibold">
              Ver guía completa →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
