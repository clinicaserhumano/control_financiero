"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarPagoConjunto } from "../actions";
import { numeroALetras, money, todayISO } from "@/lib/calculos";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { Cuenta, CampoExtra, TipoMovimiento } from "@/lib/types";

// Igual patrón que <FormularioMovimiento> (campos dinámicos según la forma
// de pago elegida) — ver el comentario ahí sobre por qué nunca hay que
// agregar un `if (tipo === 'Cheque')` acá.
function CamposExtraFields({ campos }: { campos: CampoExtra[] }) {
  if (!campos.length) return null;
  return (
    <>
      {campos.map((c) => (
        <div className="field" key={c.clave}>
          <label className={"flabel" + (c.requerido ? " flabel-req" : "")} htmlFor={`campo__${c.clave}`}>
            {c.etiqueta}
          </label>
          <input
            id={`campo__${c.clave}`}
            name={`campo__${c.clave}`}
            type={c.tipo === "number" ? "number" : c.tipo === "date" ? "date" : "text"}
            required={c.requerido}
            className="finput"
          />
        </div>
      ))}
    </>
  );
}

type Props = {
  ids: string[];
  conceptoCombinado: string;
  valorTotal: number;
  cantidad: number;
  nombres: string[];
  tiposMovimiento: TipoMovimiento[];
  cuentas: Cuenta[];
  esServiciosPrestados?: boolean;
  redirectTo: string;
};

export default function PagarConjuntoForm({
  ids,
  conceptoCombinado,
  valorTotal,
  cantidad,
  nombres,
  tiposMovimiento,
  cuentas,
  esServiciosPrestados,
  redirectTo,
}: Props) {
  const router = useRouter();
  const esAdmin = useEsAdmin();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [tipoMovimientoId, setTipoMovimientoId] = useState("");
  const [descuento, setDescuento] = useState("");
  const [incluirIVA, setIncluirIVA] = useState(false);

  const tipoSeleccionado = useMemo(() => tiposMovimiento.find((t) => t.id === tipoMovimientoId) ?? null, [tiposMovimiento, tipoMovimientoId]);
  const requiereCuenta = tipoSeleccionado?.requiere_cuenta ?? true;
  const ivaValor = esServiciosPrestados && incluirIVA ? Math.round(valorTotal * 0.15 * 100) / 100 : 0;
  const valorAPagar = Math.max(0, valorTotal + ivaValor - (parseFloat(descuento) || 0));
  const letras = numeroALetras(valorAPagar);
  const conceptoMostrado = incluirIVA ? `${conceptoCombinado} + IVA` : conceptoCombinado;

  function enviar(formData: FormData) {
    ids.forEach((id) => formData.append("movimiento_ids", id));
    startTransition(async () => {
      const resultado = await confirmarPagoConjunto(null, formData);
      if (resultado && "error" in resultado) {
        setError(resultado.error);
        return;
      }
      setError("");
      if (resultado) router.push(resultado.redirectTo);
    });
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>Pagar {cantidad} movimientos juntos</h2>
      </div>
      <div className="card-b">
        <form action={enviar} className="flex flex-col">
          <input type="hidden" name="redirect_to" value={redirectTo} />

          <div className="letras-box mb-3.5">
            {nombres.length > 0 && (
              <div>
                <b>{nombres.join(", ")}</b>
              </div>
            )}
            <div className="text-[11.5px] text-muted">{conceptoMostrado}</div>
            <div className="mt-1">
              Valor combinado: <b>{money(valorTotal)}</b>
            </div>
          </div>

          <fieldset disabled={!esAdmin} className="contents">
            <div className="field">
              <label className="flabel flabel-req" htmlFor="tipo_movimiento_id">
                Forma de pago
              </label>
              <select
                id="tipo_movimiento_id"
                name="tipo_movimiento_id"
                required
                value={tipoMovimientoId}
                onChange={(e) => setTipoMovimientoId(e.target.value)}
                className="finput"
              >
                <option value="">— Selecciona —</option>
                {tiposMovimiento.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className={requiereCuenta ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
              {requiereCuenta && (
                <div className="field">
                  <label className="flabel flabel-req" htmlFor="cuenta_id">
                    Cuenta
                  </label>
                  <select id="cuenta_id" name="cuenta_id" required className="finput">
                    <option value="">— Selecciona —</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.empresa} — {c.banco} {c.numero}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label className="flabel flabel-req" htmlFor="fecha_pago">
                  Fecha de pago
                </label>
                <input id="fecha_pago" name="fecha_pago" type="date" required defaultValue={todayISO()} className="finput" />
                {!requiereCuenta && <div className="fhint">En efectivo no se descuenta de ninguna cuenta bancaria.</div>}
              </div>
            </div>

            {tipoSeleccionado && <CamposExtraFields campos={tipoSeleccionado.campos_extra} />}

            {esServiciosPrestados && (
              <div className="field">
                <label className="flex items-center gap-2 cursor-pointer text-[12.5px] font-semibold text-ink">
                  <input
                    type="checkbox"
                    name="incluir_iva"
                    value="si"
                    checked={incluirIVA}
                    onChange={(e) => setIncluirIVA(e.target.checked)}
                  />
                  Incluir IVA (15%)
                </label>
                <div className="fhint">
                  Suma el 15% de IVA al total combinado y lo agrega al concepto de cada movimiento.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="field">
                <label className="flabel" htmlFor="descuento">
                  Descuento (USD)
                </label>
                <input
                  id="descuento"
                  name="descuento"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  className="finput"
                />
                <div className="fhint">Opcional — se aplica sobre el total combinado, no por movimiento.</div>
              </div>
              <div className="field">
                <label className="flabel" htmlFor="observaciones">
                  Observaciones
                </label>
                <input id="observaciones" name="observaciones" type="text" placeholder="Motivo del descuento…" className="finput" />
              </div>
            </div>

            <div className="letras-box mb-3.5">
              Valor combinado: <b>{money(valorTotal)}</b>
              {ivaValor > 0 && (
                <>
                  {" "}· IVA (15%): <b>{money(ivaValor)}</b>
                </>
              )}
              {parseFloat(descuento) > 0 && (
                <>
                  {" "}· Descuento: <b>{money(parseFloat(descuento) || 0)}</b>
                </>
              )}
            </div>

            <div className="letras-box mono mb-3.5">
              Valor a pagar: <b>{money(valorAPagar)}</b>
              <br />
              {letras}
            </div>
          </fieldset>

          {error && <div className="alert-error mb-3.5">{error}</div>}

          <div className="flex gap-2.5 flex-wrap mt-1.5">
            <BotonAdmin type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando…" : "Confirmar pago combinado"}
            </BotonAdmin>
          </div>
        </form>
      </div>
    </div>
  );
}
