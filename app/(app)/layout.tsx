import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rolDe, ROL_LABEL } from "@/lib/auth/roles";
import { RolProvider } from "@/lib/auth/role-context";
import NavTabs from "./nav-tabs";
import ThemeToggle from "./theme-toggle";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rol = rolDe(user.email);

  return (
    <RolProvider rol={rol}>
      <div className="min-h-screen flex flex-col">
        <header className="bg-header text-white px-[22px] py-3.5 flex items-center gap-3.5 border-b-[3px] border-amber">
          <Image src="/logo-blanco.png" alt="Ser Humano" width={97} height={40} className="flex-none h-10 w-auto" priority />
          <div>
            <h1 className="text-[17px] m-0 font-bold tracking-tight">Control Financiero</h1>
            <div className="text-xs text-white/75 mt-px">
              Egresos, nómina, cuentas por pagar e ingresos
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-white/75 hidden sm:flex items-center gap-2">
            {user.email}
            <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 rounded-full px-2 py-0.5">
              {ROL_LABEL[rol]}
            </span>
          </div>
          <ThemeToggle />
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
    </RolProvider>
  );
}
