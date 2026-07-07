-- ============================================================
-- Seguridad: RLS en tabla clientes
-- Sin acceso anon en absoluto (ni lectura ni escritura).
-- Todo pasa por Edge Functions con service_role:
--   auth-registro, auth-login, obtener-perfil-cliente.
-- ============================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas preexistentes que permitían acceso anon directo (creadas antes
-- de este cambio, fuera de cualquier migración versionada) — se eliminan
-- porque ahora todo el acceso pasa por Edge Functions con service_role.
DROP POLICY IF EXISTS "Permitir lectura de clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir inserción de clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir actualización de clientes" ON clientes;

-- Ninguna policy para anon => anon no puede SELECT/INSERT/UPDATE/DELETE.

CREATE POLICY "clientes_service_role_all"
  ON clientes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
