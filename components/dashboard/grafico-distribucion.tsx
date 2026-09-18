"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/calculos";

// Paleta solo para gráficos (no toca las variables de marca en globals.css):
// una torta con 5-8 porciones necesita colores bien distinguibles entre sí,
// más de lo que da la paleta naranja/rojo de la marca por sí sola.
const PALETA = ["#fc6b12", "#2b6cb0", "#38a169", "#d8560a", "#805ad5", "#c0392b", "#fdb44b", "#319795"];

type Item = { etiqueta: string; total: number; cantidad?: number };
type PayloadItem = { value: number; payload: Item };

function TooltipBarra({ active, payload }: { active?: boolean; payload?: PayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const it = payload[0].payload;
  return (
    <div className="rounded-[8px] border border-border bg-surface px-3 py-2 shadow-lg text-[12px]">
      <div className="font-bold text-ink">{it.etiqueta}</div>
      <div className="text-ink">
        <b>{money(it.total)}</b>
        {it.cantidad != null && <span className="text-muted"> · {it.cantidad} registro(s)</span>}
      </div>
    </div>
  );
}

function TooltipPastel({ active, payload, total }: { active?: boolean; payload?: PayloadItem[]; total: number }) {
  if (!active || !payload?.length) return null;
  const it = payload[0].payload;
  const pct = total ? ((it.total / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-[8px] border border-border bg-surface px-3 py-2 shadow-lg text-[12px]">
      <div className="font-bold text-ink">{it.etiqueta}</div>
      <div className="text-ink">
        <b>{money(it.total)}</b> <span className="text-muted">({pct}%)</span>
      </div>
    </div>
  );
}

// Alterna entre barras horizontales y pastel para la misma data — el toggle
// solo se muestra si `permitirPastel` (no todos los datos se leen bien como
// torta: un ranking de 10 nombres, por ejemplo, se queda mejor en barras).
export default function GraficoDistribucion({
  items,
  permitirPastel = true,
  vacio = "Sin datos en este período.",
}: {
  items: Item[];
  permitirPastel?: boolean;
  vacio?: string;
}) {
  const [modo, setModo] = useState<"barras" | "pastel">("barras");

  if (!items.length) {
    return (
      <div className="empty-state">
        <div className="empty-title">Sin datos</div>
        {vacio}
      </div>
    );
  }

  const total = items.reduce((s, it) => s + it.total, 0);
  const altoBarras = Math.max(160, items.length * 34);

  return (
    <div>
      {permitirPastel && (
        <div className="flex gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setModo("barras")}
            className={"btn-sm " + (modo === "barras" ? "btn-navy" : "btn-ghost")}
          >
            ▤ Barras
          </button>
          <button
            type="button"
            onClick={() => setModo("pastel")}
            className={"btn-sm " + (modo === "pastel" ? "btn-navy" : "btn-ghost")}
          >
            ◔ Pastel
          </button>
        </div>
      )}

      {modo === "barras" ? (
        <div style={{ width: "100%", height: altoBarras }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--color-muted)", fontSize: 11 }} tickFormatter={(v: number) => money(v)} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="etiqueta"
                tick={{ fill: "var(--color-ink)", fontSize: 12, fontWeight: 600 }}
                width={140}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipBarra />} cursor={{ fill: "var(--color-surface-2)" }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {items.map((it, i) => (
                  <Cell key={it.etiqueta} fill={PALETA[i % PALETA.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={items} dataKey="total" nameKey="etiqueta" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {items.map((it, i) => (
                  <Cell key={it.etiqueta} fill={PALETA[i % PALETA.length]} />
                ))}
              </Pie>
              <Tooltip content={<TooltipPastel total={total} />} />
              <Legend wrapperStyle={{ fontSize: 11.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
