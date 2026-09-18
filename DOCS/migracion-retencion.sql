-- Retención en la fuente: igual patrón que "descuento" (columna aparte, no
-- se mezcla con el monto pagado) pero con significado distinto — descuento
-- reduce lo que realmente se debía; retención es un anticipo de impuesto de
-- la otra persona que la clínica retiene y declara aparte al SRI, no un
-- gasto propio. Se guarda el valor retenido (no el %) para que el reporte
-- impreso y las listas puedan mostrarlo igual que ya muestran el descuento.
alter table movimientos_financieros add column retencion numeric null;
