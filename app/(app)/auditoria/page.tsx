import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { createClient } from "@/lib/supabase/server";
import type { EntradaAuditoria } from "@/lib/types";
import InfoBoton from "@/components/ayuda/info-boton";

const ACCION_LABEL: Record<string, string> = {
  ingreso_creado: "Ingreso creado",
  egreso_creado: "Egreso creado",
  pago_confirmado: "Pago confirmado",
  pago_combinado_confirmado: "Pago combinado",
  movimiento_editado: "Detalle corregido",
  movimiento_anulado: "Anulado",
  usuario_creado: "Usuario creado",
  usuario_editado: "Usuario editado",
  usuario_borrado: "Usuario borrado",
};

function fmtFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditoriaPage() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase.from("auditoria").select("*").order("creado_en", { ascending: false }).limit(300);
  const lista = (data ?? []) as EntradaAuditoria[];

  return (
    <div>
      <div className="flex items-start gap-2 -mt-1.5 mb-[18px]">
        <p className="text-[12.5px] text-muted m-0">
          Registro de movimientos financieros y usuarios — nadie puede editarlo ni borrarlo, ni siquiera el
          administrador. Solo el administrador ve esta pantalla.
        </p>
        <InfoBoton titulo="Historial de auditoría">
          <p className="m-0">
            Cada vez que se crea, paga, corrige o anula un movimiento — o se crea, edita o borra un usuario — queda
            un registro acá, con quién lo hizo y cuándo. Muestra los últimos 300.
          </p>
        </InfoBoton>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Historial de auditoría</h2>
          <span className="ml-auto text-[11px] text-muted font-semibold">{lista.length} registro(s)</span>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <div className="empty-title">Sin registros todavía</div>
                        Van a ir apareciendo a medida que se registren pagos, ediciones o cambios de usuarios.
                      </div>
                    </td>
                  </tr>
                ) : (
                  lista.map((a) => (
                    <tr key={a.id}>
                      <td className="text-[12px] text-muted whitespace-nowrap">{fmtFechaHora(a.creado_en)}</td>
                      <td className="font-semibold">{a.usuario_alias || a.usuario_email || "—"}</td>
                      <td>
                        <span className="pill">{ACCION_LABEL[a.accion] || a.accion}</span>
                      </td>
                      <td className="text-[12.5px] text-muted">{a.detalle}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
