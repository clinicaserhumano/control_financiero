import LoginForm from "./login-form";
import MarcaLogin from "@/components/marca-login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; motivo?: string }>;
}) {
  const { next, error, motivo } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-[380px]">
        <MarcaLogin />
        <div className="card">
          <div className="card-h">
            <h2>Iniciar sesión</h2>
          </div>
          <div className="card-b">
            {error === "link_invalido" && (
              <div className="alert-error mb-3.5">
                Ese enlace ya no es válido o expiró. Pide uno nuevo desde “¿Olvidaste tu contraseña?”.
                {motivo && <div className="mt-1 opacity-70">Detalle técnico: {motivo}</div>}
              </div>
            )}
            <LoginForm next={next || "/dashboard"} />
          </div>
        </div>
      </div>
    </main>
  );
}
