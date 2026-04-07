-- ============================================================
-- Chat: políticas adicionales para acceso directo desde frontend
-- Ejecutar DESPUÉS de 20260406000000_chat.sql
-- ============================================================

-- Anon puede crear conversaciones (la primera vez que se abre un chat)
CREATE POLICY "anon_conversaciones_insert"
  ON conversaciones FOR INSERT TO anon WITH CHECK (true);

-- Anon puede actualizar conversaciones (no_leidos, último mensaje)
CREATE POLICY "anon_conversaciones_update"
  ON conversaciones FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Anon puede insertar mensajes
CREATE POLICY "anon_mensajes_insert"
  ON mensajes FOR INSERT TO anon WITH CHECK (true);
