-- Perfiles de usuario: alias para mostrar en vez del correo, rol
-- (admin / visor) y quién generó cada reporte.
create table perfiles_usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  alias text not null,
  rol text not null default 'visor' check (rol in ('admin', 'visor')),
  creado_en timestamptz not null default now()
);

alter table perfiles_usuario enable row level security;

create policy "Cualquier usuario autenticado puede ver los perfiles"
  on perfiles_usuario for select
  to authenticated
  using (true);

-- No hace falta política de escritura: crear/editar usuarios se hace desde
-- el servidor con la service_role key, que ignora RLS.

insert into perfiles_usuario (id, email, alias, rol)
select id, email,
  case email
    when 'recepcion@serhumano.org' then 'CONTABILIDAD'
    when 'tubenessere@gmail.com' then 'JORGE'
  end,
  case email
    when 'recepcion@serhumano.org' then 'admin'
    when 'tubenessere@gmail.com' then 'visor'
  end
from auth.users
where email in ('recepcion@serhumano.org', 'tubenessere@gmail.com');
