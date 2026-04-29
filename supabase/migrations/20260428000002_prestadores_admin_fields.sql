-- Campos de control admin para prestadores
ALTER TABLE prestadores
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS trabajos_completados integer DEFAULT 0;

-- Actualizar registros existentes como activos
UPDATE prestadores SET enabled = true WHERE enabled IS NULL;
UPDATE prestadores SET trabajos_completados = 0 WHERE trabajos_completados IS NULL;
