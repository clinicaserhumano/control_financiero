-- Presupuestos mensuales por categoría de egreso (Dashboard): empiezan todos
-- en 0 ("sin presupuesto establecido") — el administrador decide si y
-- cuándo ponerle un monto a cada categoría, no viene con valores por defecto.
create table presupuestos (
  categoria text primary key check (categoria in (
    'Proveedor', 'Servicios prestados', 'Personal afiliado', 'Luz', 'Agua', 'Internet', 'Otros gastos'
  )),
  monto_mensual numeric not null default 0,
  actualizado_en timestamptz not null default now()
);

insert into presupuestos (categoria) values
  ('Proveedor'), ('Servicios prestados'), ('Personal afiliado'), ('Luz'), ('Agua'), ('Internet'), ('Otros gastos');

alter table presupuestos enable row level security;

create policy "presupuestos_select_autenticados" on presupuestos for select to authenticated using (true);
create policy "presupuestos_update_autenticados" on presupuestos for update to authenticated using (true) with check (true);
