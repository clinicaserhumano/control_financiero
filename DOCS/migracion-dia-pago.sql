-- Día de pago habitual de Personal (Servicios prestados / Afiliado), para
-- que la campanita de notificaciones avise "hoy hay que pagarle a X".
-- { "frecuencia": "semanal" | "quincenal" | "mensual", "dia": number }
-- dia = día de la semana (0=Domingo..6=Sábado) si es semanal/quincenal,
-- o día del mes (1-31) si es mensual. Null = sin día de pago asignado.
alter table terceros add column dia_pago jsonb;
