-- Permite que el panel admin y el panel del prestador lean y gestionen comisiones.
-- La app actual usa anon key + secreto admin propio, no sesiones Supabase Auth.

ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon lee comisiones" ON comisiones;
CREATE POLICY "anon lee comisiones"
  ON comisiones FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon actualiza comisiones" ON comisiones;
CREATE POLICY "anon actualiza comisiones"
  ON comisiones FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service gestiona comisiones" ON comisiones;
CREATE POLICY "service gestiona comisiones"
  ON comisiones FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
