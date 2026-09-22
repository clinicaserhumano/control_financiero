import { obtenerConfiguracion } from "@/lib/configuracion";

// Logo de la clínica, arriba a la izquierda de cualquier documento
// imprimible. <img> plano (no next/image) para que se imprima igual siempre,
// sin placeholders ni carga diferida.
export default async function PrintLogo() {
  const configuracion = await obtenerConfiguracion();
  const src = configuracion.logo_url || "/logo-color.png";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={configuracion.nombre_empresa} className="logo-print" />;
}
