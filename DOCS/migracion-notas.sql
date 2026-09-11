-- Notas y Recordatorios: notas tipo "sticky note" con recordatorio opcional
-- (fecha, hora, y si se repite) que avisa por la campanita de notificaciones.
--
-- recordatorio (jsonb, null si la nota no tiene recordatorio):
--   { "fecha": "AAAA-MM-DD", "hora": "HH:MM" | null,
--     "repetir": "ninguno" | "diario" | "semanal" | "mensual" }
-- "fecha" siempre es la PRÓXIMA fecha en que debe avisar — cuando se repite,
-- la aplicación la va adelantando sola cada vez que se cumple.

create table notas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text,
  color text not null default 'amarillo' check (color in ('amarillo', 'rosado', 'celeste', 'verde', 'naranja')),
  recordatorio jsonb,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table notas enable row level security;

-- Mismo patrón que el resto del sistema: la restricción de "solo lectura"
-- vive en la aplicación (requireAdmin en las Server Actions), no en RLS —
-- aquí solo se exige que haya una sesión iniciada.
create policy "notas_select_autenticados" on notas for select to authenticated using (true);
create policy "notas_insert_autenticados" on notas for insert to authenticated with check (true);
create policy "notas_update_autenticados" on notas for update to authenticated using (true) with check (true);
create policy "notas_delete_autenticados" on notas for delete to authenticated using (true);
