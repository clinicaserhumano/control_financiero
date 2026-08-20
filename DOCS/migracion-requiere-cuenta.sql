-- El efectivo no sale/entra de ninguna cuenta bancaria registrada, así que
-- no debe pedir seleccionar una. Esta columna es metadata (igual que
-- campos_extra) que el formulario lee dinámicamente, sin hardcodear nombres
-- de forma de pago en el código.
alter table tipos_movimiento add column requiere_cuenta boolean not null default true;

-- Solo egresos: cuando pagas tú en efectivo, no sale de ninguna cuenta
-- bancaria. Cuando te pagan a ti en efectivo (ingreso) sí hay que decir a
-- qué cuenta entra ese dinero, igual que un depósito en ventanilla.
update tipos_movimiento set requiere_cuenta = false where nombre = 'Efectivo' and direccion = 'egreso';
