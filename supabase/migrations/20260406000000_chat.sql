-- ============================================================
-- ServiciosYa — Sistema de Chat Interno
-- Una conversación por orden (cliente ↔ prestador, con contexto)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLA: conversaciones
-- Una por orden. Guarda snapshot del último mensaje y contadores
-- de no leídos para evitar COUNT queries en la lista.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversaciones (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con el negocio
  orden_id                 UUID NOT NULL UNIQUE REFERENCES ordenes(id) ON DELETE CASCADE,
  cliente_dni              TEXT NOT NULL,
  prestador_id             UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,

  -- Snapshot del último mensaje (para mostrar preview en la lista sin joins)
  ultimo_mensaje_at        TIMESTAMPTZ,
  ultimo_mensaje_contenido TEXT,
  ultimo_mensaje_sender    TEXT,  -- 'cliente' | 'prestador' | 'admin'

  -- Contadores de no leídos (actualizados en chat-enviar / chat-marcar-leido)
  no_leidos_cliente        INT NOT NULL DEFAULT 0,
  no_leidos_prestador      INT NOT NULL DEFAULT 0,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: mensajes
-- Historial completo de la conversación.
-- tipo: 'text' por ahora — preparado para 'image', 'system', etc.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id  UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,

  -- Remitente
  sender_tipo      TEXT NOT NULL CHECK (sender_tipo IN ('cliente', 'prestador', 'admin')),
  sender_id        TEXT NOT NULL,  -- DNI para cliente, UUID para prestador, 'admin' para admin

  -- Contenido
  contenido        TEXT NOT NULL CHECK (char_length(contenido) > 0 AND char_length(contenido) <= 2000),
  tipo             TEXT NOT NULL DEFAULT 'text' CHECK (tipo IN ('text', 'system')),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES para búsquedas frecuentes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente_dni   ON conversaciones(cliente_dni);
CREATE INDEX IF NOT EXISTS idx_conversaciones_prestador_id  ON conversaciones(prestador_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_orden_id      ON conversaciones(orden_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo_msg    ON conversaciones(ultimo_mensaje_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion_id     ON mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_created_at          ON mensajes(conversacion_id, created_at ASC);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Las Edge Functions usan service_role (bypass RLS).
-- La anon key solo puede leer — la app filtra por DNI/ID.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes        ENABLE ROW LEVEL SECURITY;

-- Service role: acceso total (para Edge Functions)
CREATE POLICY "service_role_conversaciones_all"
  ON conversaciones TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_mensajes_all"
  ON mensajes TO service_role USING (true) WITH CHECK (true);

-- Anon key: lectura pública (el filtrado por usuario se hace en las Edge Functions)
CREATE POLICY "anon_conversaciones_select"
  ON conversaciones FOR SELECT TO anon USING (true);

CREATE POLICY "anon_mensajes_select"
  ON mensajes FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────────────────────
-- REALTIME
-- Permite que el frontend reciba mensajes nuevos sin polling.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE mensajes        REPLICA IDENTITY FULL;
ALTER TABLE conversaciones  REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversaciones;

-- ─────────────────────────────────────────────────────────────
-- VERIFICACIÓN (descomentar para confirmar después de ejecutar)
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('conversaciones', 'mensajes');
-- ─────────────────────────────────────────────────────────────
