import { createClient } from "./supabase/server";
import type { Configuracion } from "./types";

// Valores fijos si todavía no existe la fila de configuración (recién
// migrado) o si la consulta falla por lo que sea — la app nunca debe
// quedarse sin logo/nombre/colores por un problema de datos.
const CONFIGURACION_POR_DEFECTO: Configuracion = {
  id: "",
  nombre_empresa: "Control Financiero",
  logo_url: null,
  color_primario: "#fc6b12",
  color_header: "#2b2420",
  tema_oscuro: "carbon",
  actualizado_en: "",
};

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const supabase = await createClient();
  const { data } = await supabase.from("configuracion").select("*").limit(1).maybeSingle();
  return (data as Configuracion | null) ?? CONFIGURACION_POR_DEFECTO;
}
