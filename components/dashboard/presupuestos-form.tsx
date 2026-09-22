"use client";

import { useActionState } from "react";
import { actualizarPresupuestos, type PresupuestosState } from "@/app/(app)/dashboard/actions";
import { CATEGORIAS_PRESUPUESTO } from "@/lib/dashboard";
import { money } from "@/lib/calculos";
import { useEsAdmin } from "@/lib/auth/role-context";

type Item = { categoria: string; presupuesto: number; gastado: number };

export default function PresupuestosForm({ items }: { items: Item[] }) {
  const esAdmin = useEsAdmin();
  const [state, formAction, pending] = useActionState<PresupuestosState, FormData>(actualizarPresupuestos, null);
  const porCategoria = new Map(items.map((it) => [it.categoria, it]));

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <fieldset disabled={!esAdmin} className="contents">
        {CATEGORIAS_PRESUPUESTO.map((categoria) => {
          const it = porCategoria.get(categoria) ?? { categoria, presupuesto: 0, gastado: 0 };
          const tienePresupuesto = it.presupuesto > 0;
          const pct = tienePresupuesto ? Math.min(999, (it.gastado / it.presupuesto) * 100) : 0;
          const sobrepasado = tienePresupuesto && it.gastado > it.presupuesto;
          const colorBarra = sobrepasado ? "var(--color-danger)" : pct >= 80 ? "var(--color-amber)" : "var(--color-primary)";
          return (
            <div key={categoria} className="grid grid-cols-[1fr_110px] gap-3 items-center">
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[12.5px] font-semibold text-ink truncate">{categoria}</span>
                  <span className={"text-[11px] whitespace-nowrap " + (sobrepasado ? "text-danger font-bold" : "text-muted")}>
                    {money(it.gastado)}
                    {tienePresupuesto && ` / ${money(it.presupuesto)}`}
                  </span>
                </div>
                {tienePresupuesto ? (
                  <div className="h-[6px] rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: colorBarra }} />
                  </div>
                ) : (
                  <div className="text-[10.5px] text-muted">Sin presupuesto establecido</div>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                name={`presupuesto__${categoria}`}
                defaultValue={it.presupuesto > 0 ? it.presupuesto : ""}
                placeholder="0.00"
                className="finput"
              />
            </div>
          );
        })}

        {state && "error" in state && <div className="alert-error">{state.error}</div>}
        {state && "ok" in state && <div className="text-[12px] font-semibold text-primary-dark">Presupuestos guardados.</div>}

        <div>
          <button type="submit" disabled={pending} className="btn-primary btn-sm">
            {pending ? "Guardando…" : "Guardar presupuestos"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
