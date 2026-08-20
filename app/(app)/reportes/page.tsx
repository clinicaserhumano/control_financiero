import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { movimientosConSaldo, money, totalPorTipoEstado } from "@/lib/calculos";
import type { Cuenta, MovimientoFinanciero, Tercero } from "@/lib/types";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; id?: string; desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const modo = sp.modo === "tercero" ? "tercero" : "cuenta";
  const supabase = await createClient();

  const [{ data: cuentas }, { data: terceros }] = await Promise.all([
    supabase.from("cuentas").select("*").order("empresa"),
    supabase.from("terceros").select("*").order("nombre"),
  ]);

  let resumen: { etiquetas: { label: string; valor: string }[] } | null = null;

  if (sp.id && modo === "cuenta") {
    const { data: movimientos } = await supabase
      .from("movimientos_financieros")
      .select("tipo,estado,monto,fecha,creado_en")
      .eq("cuenta_id", sp.id);
    const lista = (movimientos ?? []) as MovimientoFinanciero[];
    const conSaldo = movimientosConSaldo(lista);
    const filas = conSaldo.filter((m) => (!sp.desde || m.fecha >= sp.desde) && (!sp.hasta || m.fecha <= sp.hasta));
    const saldoActual = conSaldo.length ? conSaldo[conSaldo.length - 1].saldoAcumulado : 0;
    resumen = {
      etiquetas: [
        { label: "Movimientos en el rango", valor: String(filas.length) },
        { label: "Saldo disponible actual", valor: money(saldoActual) },
      ],
    };
  } else if (sp.id && modo === "tercero") {
    const { data: movimientos } = await supabase
      .from("movimientos_financieros")
      .select("tipo,estado,monto,fecha")
      .eq("tercero_id", sp.id);
    const lista = (movimientos ?? []) as MovimientoFinanciero[];
    const filas = lista.filter((m) => (!sp.desde || m.fecha >= sp.desde) && (!sp.hasta || m.fecha <= sp.hasta));
    resumen = {
      etiquetas: [
        { label: "Movimientos en el rango", valor: String(filas.length) },
        { label: "Saldo x pagar", valor: money(totalPorTipoEstado(lista, "egreso", "pendiente")) },
      ],
    };
  }

  const hrefImprimir = sp.id && `/imprimir/${modo === "cuenta" ? "cuentas" : "terceros"}/${sp.id}`;

  return (
    <div>
      <p className="text-[12.5px] text-muted -mt-1.5 mb-[18px]">
        Genera el reporte de movimientos de una cuenta o de un tercero en un rango de fechas, listo para imprimir en A4.
      </p>

      <div className="flex gap-1.5 mb-4">
        <Link
          href="/reportes?modo=cuenta"
          className={"rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold " + (modo === "cuenta" ? "bg-carbon border-carbon text-white" : "bg-white border-border text-[#475069] hover:border-primary")}
        >
          Por cuenta
        </Link>
        <Link
          href="/reportes?modo=tercero"
          className={"rounded-[9px] border px-3.5 py-2 text-[12.5px] font-bold " + (modo === "tercero" ? "bg-carbon border-carbon text-white" : "bg-white border-border text-[#475069] hover:border-primary")}
        >
          Por Personal
        </Link>
      </div>

      <div className="card">
        <div className="card-b">
          <form method="get" className="flex gap-3 flex-wrap items-end">
            <input type="hidden" name="modo" value={modo} />
            {modo === "cuenta" ? (
              <div className="field mb-0" style={{ minWidth: 240 }}>
                <label className="flabel flabel-req">Cuenta</label>
                <select name="id" defaultValue={sp.id || ""} className="finput">
                  <option value="">— Selecciona —</option>
                  {(cuentas ?? []).map((c: Cuenta) => (
                    <option key={c.id} value={c.id}>
                      {c.empresa} — {c.banco} {c.numero}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field mb-0" style={{ minWidth: 240 }}>
                <label className="flabel flabel-req">Personal</label>
                <select name="id" defaultValue={sp.id || ""} className="finput">
                  <option value="">— Selecciona —</option>
                  {(terceros ?? []).map((t: Tercero) => (
                    <option key={t.id} value={t.id}>
                      {[t.nombre, t.apellido].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field mb-0">
              <label className="flabel">Desde</label>
              <input type="date" name="desde" defaultValue={sp.desde || ""} className="finput" />
            </div>
            <div className="field mb-0">
              <label className="flabel">Hasta</label>
              <input type="date" name="hasta" defaultValue={sp.hasta || ""} className="finput" />
            </div>
            <button type="submit" className="btn-ghost btn-sm">
              Generar
            </button>
          </form>

          {sp.id && resumen && (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-3.5 mb-4">
                {resumen.etiquetas.map((e) => (
                  <div className="stat" key={e.label}>
                    <div className="lbl">{e.label}</div>
                    <div className="val">{e.valor}</div>
                  </div>
                ))}
              </div>
              <Link href={`${hrefImprimir}?desde=${sp.desde || ""}&hasta=${sp.hasta || ""}`} className="btn-navy">
                ↦ Imprimir reporte
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
