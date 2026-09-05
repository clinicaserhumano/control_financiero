-- Horario habitual de Personal (servicios prestados y afiliados): un
-- arreglo [{dia, entrada, salida}] por los 6 días de la semana laboral
-- (igual convención que la bitácora), opcional y editable desde la ficha.
alter table terceros add column horario jsonb not null default '[]'::jsonb;
