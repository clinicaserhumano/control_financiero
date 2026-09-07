import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Sin header/nav a propósito: estas páginas son documentos para imprimir
// (A5/A4), no pantallas de la app. Solo se valida que haya sesión.
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <div className="print-fondo bg-[#e4e2d9] min-h-screen">{children}</div>;
}
