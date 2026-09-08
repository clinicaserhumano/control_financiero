"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearMovimiento, confirmarPago, type MovimientoFormState } from "@/app/(app)/movimientos/actions";
import { numeroALetras, money, fmtDate, todayISO } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import { useEsAdmin } from "@/lib/auth/role-context";
import { BotonAdmin } from "@/lib/auth/boton-admin";
import type { Cuenta, CampoExtra, Tercero, TipoMovimiento } from "@/lib/types";

// Campos dinámicos leídos desde tipos_movimiento.campos_extra (jsonb).
// Nunca agregar un `if (tipo === 'Cheque')` aquí: una forma de pago nueva es
// una fila nueva en tipos_movimiento, no un cambio en este componente.
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

type Props =
  | {
      modo: "crear";
      tipo: "ingreso" | "egreso";
      tiposMovimiento: TipoMovimiento[];
      cuentas: Cuenta[];
      terceros?: Pick<Tercero, "id" | "nombre" | "apellido">[];
      terceroFijo?: Pick<Tercero, "id" | "nombre" | "apellido">;
      pagadoresHistoricos?: string[];
      redirectTo: string;
    }
  | {
      modo: "confirmar";
      tipo: "ingreso" | "egreso";
      tiposMovimiento: TipoMovimiento[];
      cuentas: Cuenta[];
      movimiento: { id: string; monto: number; fecha: string; concepto: string | null };
      terceroNombre?: string;
      redirectTo: string;
    };

export default function FormularioMovimiento(props: Props) {
  const router = useRouter();
  const [crearState, crearFormAction, crearPending] = useActionState<MovimientoFormState, FormData>(crearMovimiento, null);
  const [confirmarPending, startConfirmarTransition] = useTransition();
  const [confirmarError, setConfirmarError] = useState("");

  // Modo "confirmar" no usa useActionState porque, al terminar bien, hay
  // que preguntar si se quiere imprimir antes de decidir a dónde navegar
  // (con redirect() del lado del servidor no se puede interceptar eso).
  function submitConfirmar(formData: FormData) {
    startConfirmarTransition(async () => {
      const result = await confirmarPago(null, formData);
      if (result && "error" in result) {
        setConfirmarError(result.error);
        return;
      }
      setConfirmarError("");
      if (result) {
        const imprimir = window.confirm("Pago registrado correctamente. ¿Quieres imprimir el comprobante ahora?");
        router.push(imprimir ? `/imprimir/movimientos/${result.movimientoId}` : result.redirectTo);
      }
    });
  }

  const formAction = props.modo === "crear" ? crearFormAction : submitConfirmar;
  const pending = props.modo === "crear" ? crearPending : confirmarPending;
  const state = props.modo === "crear" ? crearState : confirmarError ? { error: confirmarError } : null;

  const [tipoMovimientoId, setTipoMovimientoId] = useState("");
  const tipoSeleccionado = useMemo(
    () => props.tiposMovimiento.find((t) => t.id === tipoMovimientoId) ?? null,
    [props.tiposMovimiento, tipoMovimientoId]
  );

  const [monto, setMonto] = useState(props.modo === "confirmar" ? String(props.movimiento.monto) : "");
  const [confirmarAhora, setConfirmarAhora] = useState(true);
  const [descuento, setDescuento] = useState("");
  const [razonEgreso, setRazonEgreso] = useState("");

  const letras = (() => {
    const v = parseFloat(monto);
    return !isNaN(v) && v >= 0 ? numeroALetras(v) : "—";
  })();

  const esEgreso = props.tipo === "egreso";
  const requiereCuentaYFecha = props.modo === "confirmar" || props.tipo === "ingreso" || confirmarAhora;
  // El efectivo (u otra forma de pago marcada así en tipos_movimiento) no
  // sale/entra de ninguna cuenta bancaria registrada, así que no debe pedir
  // seleccionar una — la fecha de pago sigue siendo relevante igual.
  const requiereCuenta = requiereCuentaYFecha && (tipoSeleccionado?.requiere_cuenta ?? true);
  // El descuento solo tiene sentido en el momento de pagar un egreso (a un
  // proveedor, servicios prestados o personal afiliado): confirmando un
  // pendiente, o creando uno que se paga de inmediato.
  const mostrarDescuento = esEgreso && (props.modo === "confirmar" || confirmarAhora);
  const montoBase = props.modo === "confirmar" ? props.movimiento.monto : parseFloat(monto) || 0;
  const valorAPagar = Math.max(0, montoBase - (parseFloat(descuento) || 0));
  const esAdmin = useEsAdmin();

  return (
    <div className="card">
      <div className="card-h">
        <h2>
          {props.modo === "confirmar"
            ? "Registrar pago"
            : props.modo === "crear" && props.terceroFijo
              ? "Movimiento manual"
              : props.tipo === "ingreso"
                ? "Nuevo ingreso"
                : "Nuevo egreso"}
        </h2>
      </div>
      <div className="card-b">
        <form action={formAction} className="flex flex-col">
          <input type="hidden" name="tipo" value={props.tipo} />
          <input type="hidden" name="redirect_to" value={props.redirectTo} />
          {props.modo === "confirmar" && <input type="hidden" name="movimiento_id" value={props.movimiento.id} />}

          <fieldset disabled={!esAdmin} className="contents">
          {props.modo === "confirmar" && (
            <div className="letras-box mb-3.5">
              {props.terceroNombre && (
                <div>
                  <b>{props.terceroNombre}</b>
                </div>
              )}
              <div>Fecha del cargo: {fmtDate(props.movimiento.fecha)}</div>
              <div>
                Monto: <b>{money(props.movimiento.monto)}</b>
              </div>
              {props.movimiento.concepto && <div>{props.movimiento.concepto}</div>}
            </div>
          )}

          {props.modo === "crear" && props.terceroFijo && (
            <div className="fhint mb-2">
              Para: <b>{nombreCompleto(props.terceroFijo)}</b>
            </div>
          )}

          <div className="field">
            <label className="flabel flabel-req" htmlFor="tipo_movimiento_id">
              {props.modo === "confirmar" ? "Forma de pago" : "Tipo de movimiento"}
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
              {props.tiposMovimiento.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.nombre}
                </option>
              ))}
            </select>
          </div>

          {props.modo === "crear" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="flabel flabel-req" htmlFor="fecha">
                    Fecha
                  </label>
                  <input id="fecha" name="fecha" type="date" required defaultValue={todayISO()} className="finput" />
                </div>
                <div className="field">
                  <label className="flabel flabel-req" htmlFor="monto">
                    Valor (USD)
                  </label>
                  <input
                    id="monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="finput"
                  />
                </div>
              </div>
              <div className="letras-box mono mb-3.5">{letras}</div>

              {props.tipo === "ingreso" ? (
                <div className="field">
                  <label className="flabel" htmlFor="pagador">
                    Quién paga (opcional)
                  </label>
                  <input
                    id="pagador"
                    name="pagador"
                    type="text"
                    list="pagadores-datalist"
                    autoComplete="off"
                    placeholder="Nombre del paciente / cliente"
                    className="finput"
                  />
                  <datalist id="pagadores-datalist">
                    {(props.pagadoresHistoricos ?? []).map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              ) : (
                !props.terceroFijo && (
                  <>
                    <div className="field">
                      <label className="flabel" htmlFor="tercero_id">
                        A favor de — Personal (opcional)
                      </label>
                      <select id="tercero_id" name="tercero_id" className="finput">
                        <option value="">— Ninguno —</option>
                        {(props.terceros ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {nombreCompleto(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="flabel" htmlFor="beneficiario">
                        O escribe un nombre (compra puntual, opcional)
                      </label>
                      <input
                        id="beneficiario"
                        name="beneficiario"
                        type="text"
                        placeholder="Ej: Ferretería López"
                        className="finput"
                      />
                    </div>
                  </>
                )
              )}
              {props.terceroFijo && <input type="hidden" name="tercero_id" value={props.terceroFijo.id} />}

              {esEgreso && !props.terceroFijo && (
                <div className="field">
                  <label className="flabel">Razón del egreso (opcional)</label>
                  <div className="flex gap-4 flex-wrap text-[12.5px] font-semibold text-[var(--color-ink)]">
                    {(["Luz", "Agua", "Internet", "Otros"] as const).map((op) => (
                      <label key={op} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="razon_egreso_radio"
                          value={op}
                          checked={razonEgreso === op}
                          onChange={() => setRazonEgreso(op)}
                        />
                        {op}
                      </label>
                    ))}
                    {razonEgreso && (
                      <button
                        type="button"
                        className="text-[11px] text-muted underline"
                        onClick={() => setRazonEgreso("")}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  {razonEgreso === "Otros" && (
                    <input
                      name="razon_egreso_otros"
                      type="text"
                      placeholder="¿Cuál razón?"
                      className="finput mt-2"
                      required
                    />
                  )}
                </div>
              )}

              {esEgreso && (
                <div className="field">
                  <label className="flabel">¿Ya se pagó?</label>
                  <div className="flex gap-4 flex-wrap text-[12.5px] font-semibold text-[var(--color-ink)]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="confirmar_ahora"
                        value="si"
                        checked={confirmarAhora}
                        onChange={() => setConfirmarAhora(true)}
                      />
                      Sí, pagar ahora
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="confirmar_ahora"
                        value="no"
                        checked={!confirmarAhora}
                        onChange={() => setConfirmarAhora(false)}
                      />
                      No, queda pendiente
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {requiereCuentaYFecha && (
            <div className={requiereCuenta ? "grid grid-cols-2 gap-3" : ""}>
              {requiereCuenta && (
                <div className="field">
                  <label className="flabel flabel-req" htmlFor="cuenta_id">
                    Cuenta
                  </label>
                  <select id="cuenta_id" name="cuenta_id" required className="finput">
                    <option value="">— Selecciona —</option>
                    {props.cuentas.map((c) => (
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
          )}

          {tipoSeleccionado && <CamposExtraFields campos={tipoSeleccionado.campos_extra} />}

          {mostrarDescuento && (
            <>
              <div className="grid grid-cols-2 gap-3">
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
                  <div className="fhint">Opcional, solo si hay que descontar algo del valor.</div>
                </div>
                <div className="field">
                  <label className="flabel" htmlFor="observaciones">
                    Observaciones
                  </label>
                  <input
                    id="observaciones"
                    name="observaciones"
                    type="text"
                    placeholder="Motivo del descuento…"
                    className="finput"
                  />
                </div>
              </div>
              {parseFloat(descuento) > 0 && (
                <div className="letras-box mb-3.5">
                  Valor original: <b>{money(montoBase)}</b> · Descuento: <b>{money(parseFloat(descuento) || 0)}</b> · Valor a
                  pagar: <b>{money(valorAPagar)}</b>
                </div>
              )}
            </>
          )}

          <div className="field">
            <label className="flabel" htmlFor="concepto">
              Concepto
            </label>
            <input
              id="concepto"
              name="concepto"
              type="text"
              defaultValue={props.modo === "confirmar" ? props.movimiento.concepto ?? "" : ""}
              className="finput"
            />
          </div>
          </fieldset>

          {state?.error && (
            <div className="alert-error mb-3.5">
              {state.error}
            </div>
          )}

          <div className="flex gap-2.5 flex-wrap mt-1.5">
            <BotonAdmin type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando…" : props.modo === "confirmar" ? "Registrar pago" : "Guardar"}
            </BotonAdmin>
          </div>
        </form>
      </div>
    </div>
  );
}
