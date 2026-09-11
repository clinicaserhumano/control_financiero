"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nombreCompleto } from "@/lib/terceros";

type SP = {
  desde?: string;
  hasta?: string;
  todo?: string;
  cuenta?: string;
  tercero?: string;
  tipoMov?: string;
  estado?: string;
  q?: string;
  porPagina?: string;
};

type Props = {
  tipo: "ingreso" | "egreso";
  cuentas: { id: string; empresa: string }[];
  terceros: { id: string; nombre: string; apellido: string | null }[];
  tiposMovimiento: { id: string; nombre: string }[];
  valores: SP;
  porPaginaSel: string;
};

// Cada cambio (fecha, cuenta, personal, tipo, estado, página) navega al
// instante con router.replace — sin recarga completa y sin botón "Filtrar".
// La búsqueda de texto hace lo mismo pero con debounce, para no navegar en
// cada tecla.
export default function MovimientosFiltros({ tipo, cuentas, terceros, tiposMovimiento, valores, porPaginaSel }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(valores.q || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si el filtro cambia desde afuera (links de fecha, botón atrás del
  // navegador), mantiene el cuadro de búsqueda sincronizado — ajustado
  // durante el render en vez de con un efecto, siguiendo el patrón de React
  // para derivar estado de props sin renders en cascada.
  const [qPropPrevio, setQPropPrevio] = useState(valores.q);
  if (valores.q !== qPropPrevio) {
    setQPropPrevio(valores.q);
    setQ(valores.q || "");
  }

  function navegar(overrides: Record<string, string | null>) {
    const params = new URLSearchParams();
    params.set("tipo", tipo);
    const combinado: Record<string, string | undefined> = { ...valores, porPagina: porPaginaSel, ...overrides };
    Object.entries(combinado).forEach(([k, v]) => {
      if (overrides[k] === null) return;
      if (v) params.set(k, v);
    });
    router.replace(`/movimientos?${params.toString()}`, { scroll: false });
  }

  function onQChange(valor: string) {
    setQ(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navegar({ q: valor || null }), 350);
  }

  return (
    <div className="flex gap-3 flex-wrap items-end px-4 pt-3.5">
      <div className="field mb-0">
        <label className="flabel">Desde</label>
        <input
          type="date"
          defaultValue={valores.desde || ""}
          onChange={(e) => navegar({ desde: e.target.value || null, todo: null })}
          className="finput"
        />
      </div>
      <div className="field mb-0">
        <label className="flabel">Hasta</label>
        <input
          type="date"
          defaultValue={valores.hasta || ""}
          onChange={(e) => navegar({ hasta: e.target.value || null, todo: null })}
          className="finput"
        />
      </div>
      <div className="field mb-0">
        <label className="flabel">Cuenta</label>
        <select defaultValue={valores.cuenta || ""} onChange={(e) => navegar({ cuenta: e.target.value || null })} className="finput">
          <option value="">Todas</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.empresa}
            </option>
          ))}
        </select>
      </div>
      {tipo === "egreso" && (
        <div className="field mb-0">
          <label className="flabel">Personal</label>
          <select defaultValue={valores.tercero || ""} onChange={(e) => navegar({ tercero: e.target.value || null })} className="finput">
            <option value="">Todos</option>
            {terceros.map((t) => (
              <option key={t.id} value={t.id}>
                {nombreCompleto(t)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field mb-0">
        <label className="flabel">Forma de pago</label>
        <select defaultValue={valores.tipoMov || ""} onChange={(e) => navegar({ tipoMov: e.target.value || null })} className="finput">
          <option value="">Todas</option>
          {tiposMovimiento.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="field mb-0">
        <label className="flabel">Estado</label>
        <select defaultValue={valores.estado || ""} onChange={(e) => navegar({ estado: e.target.value || null })} className="finput">
          <option value="">Todas</option>
          <option value="confirmado">Confirmadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="anulado">Anuladas</option>
        </select>
      </div>
      <div className="field mb-0">
        <label className="flabel">{tipo === "ingreso" ? "Buscar pagador / concepto" : "Buscar personal / concepto"}</label>
        <input type="text" value={q} onChange={(e) => onQChange(e.target.value)} placeholder="Escribe para buscar…" className="finput" />
      </div>
      <div className="field mb-0" style={{ maxWidth: 110 }}>
        <label className="flabel">Por página</label>
        <select defaultValue={porPaginaSel} onChange={(e) => navegar({ porPagina: e.target.value })} className="finput">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="50">50</option>
          <option value="todos">Todos</option>
        </select>
      </div>
    </div>
  );
}
