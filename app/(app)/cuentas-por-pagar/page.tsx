import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/lib/calculos";
import { nombreCompleto } from "@/lib/terceros";
import TablaPendientes from "./tabla-pendientes";
import InfoBoton from "@/components/ayuda/info-boton";
import BotonDescargarCSV from "@/components/boton-descargar-csv";

export default async function CuentasPorPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde, hasta } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("movimientos_financieros")
    .select("id,fecha,concepto,monto,tercero:terceros(id,nombre,apellido)")
    .eq("tipo", "egreso")
    .eq("estado", "pendiente");
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  query = query.order("fecha", { ascending: true });

  const { data: pendientes } = await query;

  const lista = pendientes ?? [];
  const total = lista.reduce((s, p) => s + Number(p.monto || 0), 0);

  return (
    <div>
      <div className="flex items-start gap-2 -mt-1.5 mb-[18px]">
        <p className="text-[12.5px] text-muted m-0">
          Todo egreso en estado &quot;pendiente&quot; aparece aquí automáticamente — nómina, proveedores y servicios
          comparten la misma tabla, no hay que registrarlos dos veces.
        </p>
        <InfoBoton titulo="Cuentas por Pagar" ancla="cxp">
          <p className="m-0">
            Marca dos o más filas con las casillas de la izquierda y dale a <b>Continuar con el pago</b> para
            combinarlas en un solo pago, o <b>anúlalas en bloque</b>. Un nombre en negrita es Personal registrado y
            lleva a su ficha.
          </p>
          <p className="m-0">
            Si algo aquí ya se pagó por otro lado (un duplicado), no lo borres: anúlalo para que salga de la lista
            sin perder el historial.
          </p>
        </InfoBoton>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-5">
        <div className="stat">
          <div className="lbl">Registros pendientes</div>
          <div className="val">{lista.length}</div>
        </div>
        <div className="stat">
          <div className="lbl">Total pendiente</div>
          <div className="val text-primary-dark">{money(total)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Cuentas por Pagar</h2>
          <span className="ml-auto text-[11px] text-muted font-semibold">{lista.length} registro(s)</span>
        </div>
        <div className="p-0">
          <form method="get" className="flex gap-3 flex-wrap items-end px-4 pt-3.5 pb-3.5">
            <div className="field mb-0">
              <label className="flabel">Ingresadas desde</label>
              <input type="date" name="desde" defaultValue={desde || ""} className="finput" />
            </div>
            <div className="field mb-0">
              <label className="flabel">Hasta</label>
              <input type="date" name="hasta" defaultValue={hasta || ""} className="finput" />
            </div>
            <button type="submit" className="btn-ghost btn-sm">
              Filtrar
            </button>
            {(desde || hasta) && (
              <Link href="/cuentas-por-pagar" className="btn-ghost btn-sm">
                Quitar fechas
              </Link>
            )}
            <BotonDescargarCSV
              nombreArchivo={`cuentas-por-pagar_${desde || "todas"}_a_${hasta || "hoy"}`}
              columnas={[
                { clave: "fecha", etiqueta: "Fecha" },
                { clave: "personal", etiqueta: "Personal" },
                { clave: "concepto", etiqueta: "Concepto" },
                { clave: "valor", etiqueta: "Valor" },
              ]}
              filas={lista.map((p) => ({
                fecha: fmtDate(p.fecha),
                personal: p.tercero ? nombreCompleto(p.tercero) : "",
                concepto: p.concepto || "",
                valor: Number(p.monto || 0).toFixed(2),
              }))}
              className="btn-ghost btn-sm ml-auto"
            />
            <Link
              href={`/imprimir/cuentas-por-pagar${desde || hasta ? `?desde=${desde || ""}&hasta=${hasta || ""}` : ""}`}
              className="btn-navy btn-sm"
            >
              🖨️ Imprimir
            </Link>
          </form>

          <TablaPendientes pendientes={lista} />
        </div>
      </div>
    </div>
  );
}
