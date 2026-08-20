import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la service_role key: ignora Row Level Security y puede usar la
// API de administración de Supabase Auth (crear usuarios, cambiar
// contraseñas ajenas). Úsalo SOLO dentro de Server Actions ya protegidas
// por requireAdmin() — nunca lo importes desde un componente cliente.
export function createAdminClient() {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
