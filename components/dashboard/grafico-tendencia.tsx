"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/calculos";
import type { PuntoMensual } from "@/lib/dashboard";

type PayloadItem = { value: number; name?: string; color?: string; dataKey?: string | number };

function TooltipPersonalizado({ active, payload, label }: { active?: boolean; payload?: PayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-border bg-surface px-3 py-2 shadow-lg text-[12px]">
      <div className="font-bold text-ink mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="inline-block w-[8px] h-[8px] rounded-full" style={{ background: p.color }} />
          <span className="text-ink">
            {p.name}: <b>{money(p.value)}</b>
          </span>
        </div>
      ))}
    </div>
  );
}

// Barras agrupadas Ingresos/Egresos por mes con Recharts: se estira al 100%
// del ancho del contenedor (sin dejar espacio muerto) y trae tooltip real al
// pasar el mouse, en vez del tooltip nativo lento del navegador.
export default function GraficoTendencia({ puntos }: { puntos: PuntoMensual[] }) {
  if (puntos.every((p) => p.ingresos === 0 && p.egresos === 0)) {
    return (
      <div className="empty-state">
        <div className="empty-title">Sin movimientos confirmados</div>
        No hay ingresos ni egresos confirmados en este período.
      </div>
    );
  }

  const datos = puntos.map((p) => ({ label: p.label, Ingresos: p.ingresos, Egresos: p.egresos }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={(v: number) => money(v)}
          />
          <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "var(--color-surface-2)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Ingresos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="Egresos" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
