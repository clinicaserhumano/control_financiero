"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { eliminarUsuario } from "./actions";

const ANCHO_PANEL = 260;

// Popover de confirmación (no window.confirm nativo, porque acá además hay
// que pedir la contraseña de quien confirma). Se renderiza con un portal a
// document.body y position:fixed calculado desde el botón — si no, al vivir
// dentro de la tabla (que tiene overflow-x-auto para el scroll horizontal
// en pantallas chicas), el panel queda recortado/atrapado ahí adentro.
export default function BorrarUsuarioButton({ userId, alias }: { userId: string; alias: string }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function calcularPosicion() {
    const r = botonRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.right - ANCHO_PANEL, window.innerWidth - ANCHO_PANEL - 8));
    setPos({ top: r.bottom + 6, left });
  }

  function abrir() {
    calcularPosicion();
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setPassword("");
    setError("");
  }

  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || botonRef.current?.contains(target)) return;
      cerrar();
    }
    // Si se hace scroll (la página o la tabla) mientras está abierto, mejor
    // cerrarlo — un position:fixed calculado una vez se desalinearía del
    // botón si se queda abierto mostrando una posición vieja.
    function onScroll() {
      cerrar();
    }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [abierto]);

  function confirmar() {
    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("password", password);
    startTransition(async () => {
      const resultado = await eliminarUsuario(null, formData);
      if (resultado && "error" in resultado) {
        setError(resultado.error);
        return;
      }
      cerrar();
    });
  }

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={abrir}
        className="btn-danger btn-sm"
        title={`Borrar a ${alias}`}
        aria-label={`Borrar a ${alias}`}
      >
        🗑️
      </button>
      {abierto &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: ANCHO_PANEL }}
            className="z-50 rounded-[10px] border border-border bg-surface shadow-lg p-3.5 text-left"
          >
            <div className="text-[12.5px] font-bold text-ink mb-1">¿Borrar a {alias}?</div>
            <div className="text-[11.5px] text-muted mb-2.5">
              Esta acción no se puede deshacer. Escribe tu contraseña para confirmar.
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="finput mb-2.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmar();
              }}
            />
            {error && (
              <div className="alert-error mb-2.5" style={{ fontSize: 11.5, padding: "6px 9px" }}>
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={confirmar} disabled={pending} className="btn-danger btn-sm flex-1">
                {pending ? "Borrando…" : "Sí, borrar"}
              </button>
              <button type="button" onClick={cerrar} className="btn-ghost btn-sm flex-1">
                No
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
