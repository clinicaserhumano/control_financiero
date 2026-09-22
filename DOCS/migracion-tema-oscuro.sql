-- Paleta del modo oscuro seleccionable (Configuración > Tema oscuro): antes
-- el modo oscuro tenía una sola paleta fija ("Carbón"); ahora se puede
-- elegir entre varias (ver lib/temas-oscuros.ts para los valores exactos).
alter table configuracion add column tema_oscuro text not null default 'carbon'
  check (tema_oscuro in ('carbon', 'negro', 'azul_marino'));
