-- Configuración de marca (Administrador): nombre de la razón social, logo y
-- colores principales — hoy están fijos en el código, esto los vuelve
-- editables desde la app sin tocar nada. Fila única (singleton): la app
-- siempre lee/edita la primera fila, nunca crea una segunda.
create table configuracion (
  id uuid primary key default gen_random_uuid(),
  nombre_empresa text not null default 'Control Financiero',
  logo_url text null,
  color_primario text not null default '#fc6b12',
  color_header text not null default '#2b2420',
  actualizado_en timestamptz not null default now()
);

insert into configuracion (nombre_empresa) values ('Control Financiero');

alter table configuracion enable row level security;

-- Mismo patrón que el resto del sistema: la restricción de "solo
-- Administrador puede editar" vive en el código de la app (requireAdmin en
-- la Server Action), no en RLS — igual que notas, perfiles_usuario, etc.
create policy "configuracion_select_autenticados" on configuracion for select to authenticated using (true);
create policy "configuracion_update_autenticados" on configuracion for update to authenticated using (true) with check (true);

-- Bucket público para el logo subido — público de lectura porque el logo
-- se muestra en pantallas de login (sin sesión) y en los documentos impresos.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_select_publico" on storage.objects for select using (bucket_id = 'logos');
create policy "logos_insert_autenticados" on storage.objects for insert to authenticated with check (bucket_id = 'logos');
create policy "logos_update_autenticados" on storage.objects for update to authenticated using (bucket_id = 'logos');
create policy "logos_delete_autenticados" on storage.objects for delete to authenticated using (bucket_id = 'logos');
