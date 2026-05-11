-- ─────────────────────────────────────────────────────────────
-- MIGRACIÓN: Sistema de reservas + comisiones
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ─────────────────────────────────────────────────────────────

-- 1. Agregar columnas faltantes a la tabla reservas
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'reserva_activa',
  ADD COLUMN IF NOT EXISTS zona TEXT,
  ADD COLUMN IF NOT EXISTS descripcion_trabajo TEXT,
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT,
  ADD COLUMN IF NOT EXISTS cancelacion_solicitada_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trabajo_concretado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Actualizar filas existentes que no tienen estado
UPDATE reservas SET estado = 'reserva_activa' WHERE estado IS NULL;

-- 2. Crear tabla de comisiones
CREATE TABLE IF NOT EXISTS comisiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE,
  prestador_id UUID REFERENCES prestadores(id),
  monto INTEGER DEFAULT 3000,
  estado TEXT DEFAULT 'comision_pendiente',
  -- estados: comision_pendiente | link_pago_generado | comision_pagada | comision_vencida | incidente
  mp_preference_id TEXT,
  mp_init_point TEXT,
  mp_payment_id TEXT,
  mp_payment_estado TEXT,
  email_enviado BOOLEAN DEFAULT FALSE,
  link_generado_at TIMESTAMPTZ,
  pagado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices útiles
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_prestador ON reservas(prestador_id);
CREATE INDEX IF NOT EXISTS idx_reservas_dia ON reservas(dia);
CREATE INDEX IF NOT EXISTS idx_comisiones_reserva ON comisiones(reserva_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_prestador ON comisiones(prestador_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON comisiones(estado);
