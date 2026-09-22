import Image from "next/image";
import { obtenerConfiguracion } from "@/lib/configuracion";

// Logo + nombre de marca para las pantallas fuera de sesión (login,
// recuperar contraseña, restablecer) — mismo componente en las tres para no
// triplicar la lógica de "si hay logo subido, usarlo".
export default async function MarcaLogin() {
  const configuracion = await obtenerConfiguracion();
  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      {configuracion.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={configuracion.logo_url} alt={configuracion.nombre_empresa} className="max-w-[210px] max-h-[90px] w-auto h-auto object-contain" />
      ) : (
        <Image src="/logo-color.png" alt={configuracion.nombre_empresa} width={210} height={90} priority />
      )}
      <h1 className="text-[15px] font-bold text-ink leading-tight">{configuracion.nombre_empresa}</h1>
    </div>
  );
}
