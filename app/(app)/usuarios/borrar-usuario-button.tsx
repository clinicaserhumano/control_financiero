"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { eliminarUsuario } from "./actions";

// Popover de confirmación (no window.confirm nativo, porque acá además hay
// que pedir la contraseña de quien confirma) — mismo patrón que la
// campanita de notificaciones: panel flotante que se cierra solo con clic
// afuera.
export default function BorrarUsuarioButton({ userId, alias }: { userId: string; alias: string }) {
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cerrar();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  function cerrar() {
    setAbierto(false);
    setPassword("");
    setError("");
  }

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
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="btn-danger btn-sm"
        title={`Borrar a ${alias}`}
        aria-label={`Borrar a ${alias}`}
      >
        🗑️
      </button>
      {abierto && (
        <div className="absolute right-0 z-30 mt-2 w-[260px] rounded-[10px] border border-border bg-surface shadow-lg p-3.5 text-left">
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
        </div>
      )}
    </div>
  );
}
