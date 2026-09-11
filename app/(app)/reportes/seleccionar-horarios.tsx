"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TERCERO_TIPO_LABEL } from "@/lib/terceros";
import type { Tercero } from "@/lib/types";

type Filtro = "activos" | "inactivos" | "todos";
type Persona = Pick<Tercero, "id" | "nombre" | "apellido" | "tipo" | "activo" | "tarea">;

export default function SeleccionarHorarios({ personal }: { personal: Persona[] }) {
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const visibles = useMemo(
    () => personal.filter((p) => (filtro === "todos" ? true : filtro === "activos" ? p.activo : !p.activo)),
    [personal, filtro]
  );
  const todosSeleccionados = visibles.length > 0 && visibles.every((p) => seleccionados.has(p.id));

  function toggle(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (todosSeleccionados) visibles.forEach((p) => next.delete(p.id));
      else visibles.forEach((p) => next.add(p.id));
      return next;
    });
  }

  return (
    <div>
      <div className="flex gap-3 flex-wrap items-end mb-4">
        <div className="field mb-0" style={{ minWidth: 180 }}>
          <label className="flabel">Personal</label>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} className="finput">
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer mb-[9px]">
          <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} />
          Seleccionar todos ({visibles.length})
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Tarea</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-title">Sin registros</div>
                    No hay Personal con este filtro.
                  </div>
                </td>
              </tr>
            ) : (
              visibles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" checked={seleccionados.has(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td className="font-semibold">{[p.nombre, p.apellido].filter(Boolean).join(" ")}</td>
                  <td className="text-muted text-[12px]">{TERCERO_TIPO_LABEL[p.tipo]}</td>
                  <td className="text-muted text-[12px]">{p.tarea || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        {seleccionados.size > 0 ? (
          <Link href={`/imprimir/horarios?ids=${[...seleccionados].join(",")}`} className="btn-navy">
            🖨️ Imprimir horario ({seleccionados.size} seleccionado{seleccionados.size === 1 ? "" : "s"})
          </Link>
        ) : (
          <button type="button" disabled className="btn-navy opacity-40 cursor-not-allowed">
            🖨️ Imprimir horario
          </button>
        )}
      </div>
    </div>
  );
}
