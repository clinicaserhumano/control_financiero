import { fmtDate, todayISO } from "@/lib/calculos";
import { obtenerConfiguracion } from "@/lib/configuracion";

// Pie de página de todo documento imprimible: quién lo generó y el nombre
// de la marca — antes "Control Financiero · Ser Humano" quedaba fijo en
// cada página, ahora sale de Configuración en un solo lugar.
export default async function PrintFooter({
  perfil,
  etiqueta = "Generado el",
}: {
  perfil: { alias: string | null; email?: string | null } | null;
  etiqueta?: string;
}) {
  const configuracion = await obtenerConfiguracion();
  return (
    <div className="foot">
      <span>
        {etiqueta} {fmtDate(todayISO())} por {perfil?.alias || perfil?.email || "—"}
      </span>
      <span>{configuracion.nombre_empresa}</span>
    </div>
  );
}
