import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavTabs from "./nav-tabs";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-carbon text-white px-[22px] py-3.5 flex items-center gap-3.5 border-b-[3px] border-amber">
        <Image src="/logo-blanco.png" alt="Ser Humano" width={97} height={40} className="flex-none h-10 w-auto" priority />
        <div>
          <h1 className="text-[17px] m-0 font-bold tracking-tight">Control Financiero</h1>
          <div className="text-xs text-[#cfc0b6] mt-px">
            Egresos, nómina, cuentas por pagar e ingresos
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-[#cfc0b6] hidden sm:block">{user.email}</div>
        <form action={signOut}>
          <button type="submit" className="btn-ghost btn-sm">
            Cerrar sesión
          </button>
        </form>
      </header>
      <Suspense fallback={<div className="h-[45px] bg-carbon-2" />}>
        <NavTabs />
      </Suspense>
      <main className="flex-1 max-w-[1180px] w-full mx-auto px-[22px] pt-6 pb-[60px]">{children}</main>
    </div>
  );
}
