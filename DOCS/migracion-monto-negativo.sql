-- Permite registrar correcciones de "pago de más" a Personal (ej. un cheque
-- duplicado por error): un egreso con monto NEGATIVO y estado 'pendiente'
-- representa que esa persona le debe ese valor a la clínica, y se resta
-- sola del próximo pago real cuando se combinen ambos ("pago combinado").
-- Antes la restricción exigía monto > 0; ahora solo exige que no sea $0
-- (un movimiento de $0 no tiene sentido en ningún caso).
alter table movimientos_financieros drop constraint if exists movimientos_financieros_monto_check;
alter table movimientos_financieros add constraint movimientos_financieros_monto_check check (monto <> 0);
