import Image from "next/image";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image src="/logo-color.png" alt="Ser Humano" width={210} height={90} priority />
          <h1 className="text-[15px] font-bold text-carbon leading-tight">Control Financiero</h1>
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Iniciar sesión</h2>
          </div>
          <div className="card-b">
            <LoginForm next={next || "/cuentas"} />
          </div>
        </div>
      </div>
    </main>
  );
}
