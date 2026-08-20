"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    // Sincroniza con la clase que el script anti-parpadeo (app/layout.tsx) ya
    // aplicó al <html> antes del primer paint, leyendo localStorage — un
    // sistema externo al que React no tiene acceso durante el render inicial.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    document.documentElement.classList.toggle("dark", nuevo);
    localStorage.setItem("tema", nuevo ? "dark" : "light");
    setOscuro(nuevo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className="btn-ghost btn-sm !px-2.5"
      title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Cambiar tema"
    >
      {oscuro ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
        </svg>
      )}
    </button>
  );
}
