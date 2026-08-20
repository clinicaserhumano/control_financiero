import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saldoCuenta, money } from "@/lib/calculos";
import type { Cuenta } from "@/lib/types";
import CuentaForm from "./cuenta-form";
import EliminarCuentaButton from "./eliminar-cuenta-button";

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const { editar } = await searchParams;
  const supabase = await createClient();

  const [{ data: cuentas }, { data: movimientos }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("movimientos_financieros").select("cuenta_id,tipo,estado,monto,fecha,creado_en"),
  ]);

  const listaCuentas = (cuentas ?? []) as Cuenta[];
  const cuentaEditando = editar ? listaCuentas.find((c) => c.id === editar) ?? null : null;

  const movsPorCuenta = new Map<string, typeof movimientos>();
  (movimientos ?? []).forEach((m) => {
    if (!m.cuenta_id) return;
    const lista = movsPorCuenta.get(m.cuenta_id) ?? [];
    lista.push(m);
    movsPorCuenta.set(m.cuenta_id, lista);
  });

  return (
    <div>
      <p className="text-[12.5px] text-muted -mt-1.5 mb-[18px]">
        Cada cuenta agrupa una empresa, su RUC y la cuenta bancaria. Todos los movimientos (ingresos y egresos)
        comparten una sola tabla; aquí ves el saldo consolidado de cada cuenta.
      </p>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <CuentaForm cuentaEditando={cuentaEditando} />

        <div className="card">
          <div className="card-h">
            <h2>Cuentas registradas</h2>
            <span className="ml-auto text-[11px] text-muted font-semibold">{listaCuentas.length} cuenta(s)</span>
          </div>
          <div className="p-0">
            {listaCuentas.length === 0 ? (
              <div className="empty-state">
                <div className="text-[15px] font-semibold text-[#475069] mb-1">Sin cuentas</div>
                Crea tu primera cuenta para comenzar a registrar movimientos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Empresa / RUC</th>
                      <th>Banco / Cuenta</th>
                      <th className="td-num">Saldo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaCuentas.map((c) => {
                      const saldo = saldoCuenta(movsPorCuenta.get(c.id) ?? []);
                      return (
                        <tr key={c.id}>
                          <td>
                            <b>{c.empresa}</b>
                            <br />
                            <span className="mono text-muted">RUC {c.ruc}</span>
                          </td>
                          <td>
                            {c.banco}
                            <br />
                            <span className="mono text-muted">
                              {c.tipo} {c.numero}
                            </span>
                          </td>
                          <td className={"td-num font-bold " + (saldo < 0 ? "text-danger" : "text-carbon")}>
                            {money(saldo)}
                          </td>
                          <td>
                            <div className="flex gap-1.5 justify-end">
                              <Link href={`/cuentas/${c.id}`} className="btn-navy btn-sm">
                                Estado de cuenta
                              </Link>
                              <Link href={`/cuentas?editar=${c.id}`} className="btn-ghost btn-sm">
                                Editar
                              </Link>
                              <EliminarCuentaButton id={c.id} empresa={c.empresa} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
