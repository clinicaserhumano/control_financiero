import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROL_LABEL } from "@/lib/auth/roles";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { obtenerConfiguracion } from "@/lib/configuracion";
import { RolProvider } from "@/lib/auth/role-context";
import NavTabs from "./nav-tabs";
import ThemeToggle from "./theme-toggle";
import Campanita from "./campanita";
import BuscadorGlobal from "@/components/buscador-global";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const perfil = await obtenerPerfilActual();
  const rol = perfil?.rol ?? "visor";
  const configuracion = await obtenerConfiguracion();

  return (
    <RolProvider rol={rol}>
      {/* NavTabs pone la barra lateral (fija, no se va con el scroll) y el
          botón/panel móvil, y envuelve el resto con el margen izquierdo que
          le corresponde según esté compacta o expandida — así ambas cosas
          nunca se desincronizan entre sí (ver nav-tabs.tsx). */}
      <NavTabs nombreEmpresa={configuracion.nombre_empresa} logoUrl={configuracion.logo_url}>
        <header className="bg-header text-white pl-14 pr-4 sm:px-[22px] py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3.5 border-b-[3px] border-amber">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <BuscadorGlobal />
            <Campanita />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 sm:gap-3.5">
            <div className="text-xs text-white/75 hidden sm:flex items-center gap-2">
              {perfil?.alias || user.email}
              <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 rounded-full px-2 py-0.5">
                {ROL_LABEL[rol]}
              </span>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn-ghost btn-sm">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-[22px] pt-4 sm:pt-6 pb-[60px]">{children}</main>
      </NavTabs>
    </RolProvider>
  );
}
