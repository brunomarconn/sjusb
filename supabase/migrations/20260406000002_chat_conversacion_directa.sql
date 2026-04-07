-- ============================================================
-- Chat: soporte para conversaciones directas (sin orden)
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- Hacer orden_id opcional (conversaciones directas no tienen orden)
ALTER TABLE conversaciones ALTER COLUMN orden_id DROP NOT NULL;

-- Índice único para conversaciones directas: un solo chat por cliente+prestador sin orden
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversaciones_directa
  ON conversaciones(cliente_dni, prestador_id)
  WHERE orden_id IS NULL;
