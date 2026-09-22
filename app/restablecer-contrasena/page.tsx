import RestablecerForm from "./restablecer-form";
import MarcaLogin from "@/components/marca-login";

export default function RestablecerContrasenaPage() {
  return (
    <main className="flex-1 flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-[380px]">
        <MarcaLogin />
        <div className="card">
          <div className="card-h">
            <h2>Crear nueva contraseña</h2>
          </div>
          <div className="card-b">
            <RestablecerForm />
          </div>
        </div>
      </div>
    </main>
  );
}
