import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { obtenerConfiguracion } from "@/lib/configuracion";
import ConfiguracionForm from "./configuracion-form";

export default async function ConfiguracionPage() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol !== "admin") redirect("/");

  const configuracion = await obtenerConfiguracion();

  return (
    <div>
      <p className="text-[12.5px] text-muted -mt-1.5 mb-[18px]">
        Nombre, logo y colores de la marca — se usan en toda la aplicación y en los documentos impresos. Solo el
        administrador ve esta pantalla.
      </p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-h">
          <h2>Configuración</h2>
        </div>
        <div className="card-b">
          <ConfiguracionForm configuracion={configuracion} />
        </div>
      </div>
    </div>
  );
}
