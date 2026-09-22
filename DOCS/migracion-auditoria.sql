-- Historial de auditoría: registro de solo agregar (nadie puede editarlo ni
-- borrarlo, ni siquiera el administrador — por eso no hay policy de update
-- ni de delete) de los cambios financieros y de usuarios más importantes.
create table auditoria (
  id uuid primary key default gen_random_uuid(),
  accion text not null,
  detalle text not null,
  usuario_email text,
  usuario_alias text,
  creado_en timestamptz not null default now()
);

alter table auditoria enable row level security;

create policy "auditoria_select_autenticados" on auditoria for select to authenticated using (true);
create policy "auditoria_insert_autenticados" on auditoria for insert to authenticated with check (true);
