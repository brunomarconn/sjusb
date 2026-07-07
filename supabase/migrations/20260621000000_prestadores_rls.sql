-- ============================================================
-- Seguridad: RLS en tabla prestadores
-- Lectura pública, escritura solo via service_role (Edge Functions)
-- ============================================================

ALTER TABLE prestadores ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer prestadores (listado público)
CREATE POLICY "prestadores_select_publico"
  ON prestadores FOR SELECT
  TO anon
  USING (true);

-- Solo service_role puede escribir (a través de Edge Functions con admin secret)
CREATE POLICY "prestadores_service_role_all"
  ON prestadores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
