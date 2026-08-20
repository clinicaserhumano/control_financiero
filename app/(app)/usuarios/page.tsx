import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { createClient } from "@/lib/supabase/server";
import FormularioCrearUsuario from "./formulario-crear-usuario";
import ListaUsuarios from "./lista-usuarios";

export default async function UsuariosPage() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: usuarios } = await supabase.from("perfiles_usuario").select("*").order("creado_en");

  return (
    <div>
      <p className="text-[12.5px] text-muted -mt-1.5 mb-[18px]">
        Crea y administra las cuentas que pueden entrar al sistema. Solo el administrador ve esta pantalla.
      </p>

      <div className="card mb-5">
        <div className="card-h">
          <h2>Nuevo usuario</h2>
        </div>
        <div className="card-b">
          <FormularioCrearUsuario />
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Usuarios ({(usuarios ?? []).length})</h2>
        </div>
        <div className="card-b">
          <ListaUsuarios usuarios={usuarios ?? []} idUsuarioActual={perfil.id} />
        </div>
      </div>
    </div>
  );
}
