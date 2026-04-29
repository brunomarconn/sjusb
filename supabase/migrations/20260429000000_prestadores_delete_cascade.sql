-- Permite eliminar prestadores aunque tengan reservas asociadas.
-- Sin ON DELETE CASCADE, reservas.prestador_id bloquea el borrado.
ALTER TABLE reservas
  DROP CONSTRAINT IF EXISTS reservas_prestador_id_fkey;

ALTER TABLE reservas
  ADD CONSTRAINT reservas_prestador_id_fkey
  FOREIGN KEY (prestador_id)
  REFERENCES prestadores(id)
  ON DELETE CASCADE;
