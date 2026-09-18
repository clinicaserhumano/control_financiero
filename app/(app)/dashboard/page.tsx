import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, todayISO, saldoCuenta, totalPorTipoEstado } from "@/lib/calculos";
import {
  tendenciaMensual,
  egresosPorCategoria,
  egresosPorFormaPago,
  topBeneficiarios,
  pendientesPorAntiguedad,
  type MovDashboard,
} from "@/lib/dashboard";
import GraficoTendencia from "@/components/dashboard/grafico-tendencia";
import GraficoDistribucion from "@/components/dashboard/grafico-distribucion";
import BotonDescargarCSV from "@/components/boton-descargar-csv";
import InfoBoton from "@/components/ayuda/info-boton";

type MovConRelaciones = MovDashboard & { creado_en: string; cuenta_id: string | null };

function mesAnteriorDe(mesISO: string): string {
  let [y, m] = mesISO.split("-").map(Number);
  m--;
  if (m < 1) {
    m = 12;
    y--;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function variacion(actual: number, anterior: number): string {
  if (anterior === 0) return actual === 0 ? "Sin cambios" : "Nuevo este mes";
  const pct = ((actual - anterior) / anterior) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs mes anterior`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const hoy = todayISO();
  const desde = sp.desde || `${hoy.slice(0, 4)}-01-01`;
  const hasta = sp.hasta || hoy;

  const supabase = await createClient();
  const { data: movimientos } = await supabase
    .from("movimientos_financieros")
    .select(
      "tipo,estado,monto,fecha,creado_en,cuenta_id,pagador,beneficiario,razon_egreso,tercero:terceros(tipo,nombre,apellido),tipo_movimiento:tipos_movimiento(nombre)"
    )
    .neq("estado", "anulado");

  const lista = (movimientos ?? []) as unknown as MovConRelaciones[];
  const enRango = lista.filter((m) => m.fecha >= desde && m.fecha <= hasta);

  // ---- KPIs: siempre sobre el estado real actual, sin importar el filtro ----
  const mesActual = hoy.slice(0, 7);
  const mesAnterior = mesAnteriorDe(mesActual);
  const confirmados = lista.filter((m) => m.estado === "confirmado");
  const totalMes = (tipo: "ingreso" | "egreso", mes: string) =>
    confirmados.filter((m) => m.tipo === tipo && m.fecha.slice(0, 7) === mes).reduce((s, m) => s + Number(m.monto || 0), 0);

  const ingresosMesActual = totalMes("ingreso", mesActual);
  const egresosMesActual = totalMes("egreso", mesActual);
  const ingresosMesAnterior = totalMes("ingreso", mesAnterior);
  const egresosMesAnterior = totalMes("egreso", mesAnterior);
  const saldoNetoMes = ingresosMesActual - egresosMesActual;
  const totalPendiente = totalPorTipoEstado(lista, "egreso", "pendiente");
  const saldoTotalCuentas = saldoCuenta(lista);

  // ---- Gráficos: respetan el filtro Desde/Hasta ----
  const tendencia = tendenciaMensual(enRango, desde, hasta);
  const categorias = egresosPorCategoria(enRango);
  const formasPago = egresosPorFormaPago(enRango);
  const topBenef = topBeneficiarios(enRango, 10);
  const antiguedad = pendientesPorAntiguedad(lista, hoy);

  return (
    <div>
      <div className="flex items-start gap-2 -mt-1.5 mb-[18px]">
        <p className="text-[12.5px] text-muted m-0">
          Vista general de solo lectura: no cambia nada, resume visualmente lo que ya está en Movimientos, Cuentas y
          Cuentas por Pagar.
        </p>
        <InfoBoton titulo="Dashboard">
          <p className="m-0">
            Las tarjetas de arriba (mes actual, saldo, pendiente) siempre reflejan el estado real de hoy. Los
            gráficos de abajo respetan el rango de fechas que elijas.
          </p>
          <p className="m-0">
            <b>Pendientes por antigüedad</b> no depende del filtro de fechas — siempre muestra todo lo que sigue
            pendiente hoy, agrupado por cuántos días lleva esperando pago.
          </p>
        </InfoBoton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
        <div className="stat">
          <div className="lbl">Ingresos del mes</div>
          <div className="val text-primary-dark">{money(ingresosMesActual)}</div>
          <div className="text-[11px] text-muted mt-1">{variacion(ingresosMesActual, ingresosMesAnterior)}</div>
        </div>
        <div className="stat">
          <div className="lbl">Egresos del mes</div>
          <div className="val">{money(egresosMesActual)}</div>
          <div className="text-[11px] text-muted mt-1">{variacion(egresosMesActual, egresosMesAnterior)}</div>
        </div>
        <div className="stat">
          <div className="lbl">Saldo neto del mes</div>
          <div className={"val " + (saldoNetoMes < 0 ? "text-danger" : "")}>{money(saldoNetoMes)}</div>
        </div>
        <div className="stat">
          <div className="lbl">Pendiente por pagar</div>
          <div className="val">{money(totalPendiente)}</div>
        </div>
        <div className="stat">
          <div className="lbl">Saldo en cuentas</div>
          <div className={"val " + (saldoTotalCuentas < 0 ? "text-danger" : "")}>{money(saldoTotalCuentas)}</div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="card-b">
          <form className="flex gap-3 flex-wrap items-end" method="get">
            <div className="field mb-0">
              <label className="flabel" htmlFor="desde">
                Desde
              </label>
              <input id="desde" name="desde" type="date" defaultValue={desde} className="finput" />
            </div>
            <div className="field mb-0">
              <label className="flabel" htmlFor="hasta">
                Hasta
              </label>
              <input id="hasta" name="hasta" type="date" defaultValue={hasta} className="finput" />
            </div>
            <button type="submit" className="btn-ghost btn-sm">
              Filtrar
            </button>
            {(sp.desde || sp.hasta) && (
              <Link href="/dashboard" className="btn-ghost btn-sm">
                Volver al año actual
              </Link>
            )}
          </form>
        </div>
      </div>

      <div className="card mb-5">
        <div className="card-h">
          <h2>Ingresos vs Egresos por mes</h2>
          <BotonDescargarCSV
            nombreArchivo={`tendencia-mensual_${desde}_a_${hasta}`}
            columnas={[
              { clave: "mes", etiqueta: "Mes" },
              { clave: "ingresos", etiqueta: "Ingresos" },
              { clave: "egresos", etiqueta: "Egresos" },
            ]}
            filas={tendencia.map((p) => ({ mes: p.label, ingresos: p.ingresos.toFixed(2), egresos: p.egresos.toFixed(2) }))}
            className="btn-ghost btn-sm ml-auto"
          />
        </div>
        <div className="card-b">
          <GraficoTendencia puntos={tendencia} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-h">
            <h2>Egresos por categoría</h2>
            <BotonDescargarCSV
              nombreArchivo={`egresos-por-categoria_${desde}_a_${hasta}`}
              columnas={[
                { clave: "etiqueta", etiqueta: "Categoría" },
                { clave: "total", etiqueta: "Total" },
              ]}
              filas={categorias.map((c) => ({ etiqueta: c.etiqueta, total: c.total.toFixed(2) }))}
              className="btn-ghost btn-sm ml-auto"
            />
          </div>
          <div className="card-b">
            <GraficoDistribucion items={categorias.map((c) => ({ etiqueta: c.etiqueta, total: c.total }))} />
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h2>Egresos por forma de pago</h2>
            <BotonDescargarCSV
              nombreArchivo={`egresos-por-forma-pago_${desde}_a_${hasta}`}
              columnas={[
                { clave: "etiqueta", etiqueta: "Forma de pago" },
                { clave: "total", etiqueta: "Total" },
              ]}
              filas={formasPago.map((f) => ({ etiqueta: f.etiqueta, total: f.total.toFixed(2) }))}
              className="btn-ghost btn-sm ml-auto"
            />
          </div>
          <div className="card-b">
            <GraficoDistribucion items={formasPago.map((f) => ({ etiqueta: f.etiqueta, total: f.total }))} />
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h2>Top 10 — a quién más se le paga</h2>
            <BotonDescargarCSV
              nombreArchivo={`top-beneficiarios_${desde}_a_${hasta}`}
              columnas={[
                { clave: "etiqueta", etiqueta: "Beneficiario" },
                { clave: "total", etiqueta: "Total" },
              ]}
              filas={topBenef.map((t) => ({ etiqueta: t.etiqueta, total: t.total.toFixed(2) }))}
              className="btn-ghost btn-sm ml-auto"
            />
          </div>
          <div className="card-b">
            <GraficoDistribucion items={topBenef.map((t) => ({ etiqueta: t.etiqueta, total: t.total }))} permitirPastel={false} />
            <div className="fhint mt-2">No se muestra como pastel: con 10 nombres las porciones quedan demasiado finas para leerse.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h2>Pendientes por antigüedad</h2>
            <BotonDescargarCSV
              nombreArchivo={`pendientes-por-antiguedad_${hoy}`}
              columnas={[
                { clave: "etiqueta", etiqueta: "Antigüedad" },
                { clave: "total", etiqueta: "Total" },
                { clave: "cantidad", etiqueta: "Cantidad" },
              ]}
              filas={antiguedad.map((a) => ({ etiqueta: a.etiqueta, total: a.total.toFixed(2), cantidad: a.cantidad }))}
              className="btn-ghost btn-sm ml-auto"
            />
          </div>
          <div className="card-b">
            <GraficoDistribucion items={antiguedad} vacio="No hay egresos pendientes por pagar." />
          </div>
        </div>
      </div>
    </div>
  );
}
