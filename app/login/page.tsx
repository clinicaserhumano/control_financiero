import Image from "next/image";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; motivo?: string }>;
}) {
  const { next, error, motivo } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image src="/logo-color.png" alt="Ser Humano" width={210} height={90} priority />
          <h1 className="text-[15px] font-bold text-ink leading-tight">Control Financiero</h1>
        </div>
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
            <LoginForm next={next || "/cuentas"} />
          </div>
        </div>
      </div>
    </main>
  );
}
