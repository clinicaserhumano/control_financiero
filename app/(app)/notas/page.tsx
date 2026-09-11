import { createClient } from "@/lib/supabase/server";
import type { Nota } from "@/lib/types";
import NotaForm from "./nota-form";
import NotaCard from "./nota-card";
import InfoBoton from "@/components/ayuda/info-boton";

export default async function NotasPage() {
  const supabase = await createClient();
  const { data: notas } = await supabase.from("notas").select("*").order("creado_en", { ascending: false });
  const lista = (notas ?? []) as Nota[];

  return (
    <div>
      <div className="flex items-start gap-2 -mt-1.5 mb-[18px]">
        <p className="text-[12.5px] text-muted m-0">
          Notas rápidas tipo sticky note, con recordatorio opcional que avisa por la campanita 🔔.
        </p>
        <InfoBoton titulo="Notas y Recordatorios" ancla="notas">
          <p className="m-0">
            Crea una nota con el formulario de la izquierda. Si marcas <b>Agregar recordatorio</b>, eliges la fecha
            (y hora, opcional) en que debe avisar, y si se repite (diario, semanal o mensual).
          </p>
          <p className="m-0">
            Una nota con recordatorio vencido sale resaltada en rojo y también aparece en la campanita 🔔 — el botón{" "}
            <b>Visto</b> la apaga por hoy (o la manda a su próxima fecha, si se repite).
          </p>
        </InfoBoton>
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <NotaForm />

        <div>
          {lista.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Sin notas todavía</div>
              Crea la primera con el formulario de la izquierda.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((nota) => (
                <NotaCard key={nota.id} nota={nota} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
