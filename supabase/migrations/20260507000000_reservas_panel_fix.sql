-- Fix panel prestador: columnas esperadas, comisiones y politicas RLS de reservas.

ALTER TABLE prestadores
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS trabajos_completados integer DEFAULT 0;

UPDATE prestadores SET enabled = true WHERE enabled IS NULL;
UPDATE prestadores SET trabajos_completados = 0 WHERE trabajos_completados IS NULL;

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'reserva_activa',
  ADD COLUMN IF NOT EXISTS zona text,
  ADD COLUMN IF NOT EXISTS descripcion_trabajo text,
  ADD COLUMN IF NOT EXISTS motivo_cancelacion text,
  ADD COLUMN IF NOT EXISTS cancelacion_solicitada_at timestamptz,
  ADD COLUMN IF NOT EXISTS trabajo_concretado_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

UPDATE reservas SET estado = 'reserva_activa' WHERE estado IS NULL;

CREATE TABLE IF NOT EXISTS comisiones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id uuid REFERENCES reservas(id) ON DELETE CASCADE,
  prestador_id uuid REFERENCES prestadores(id),
  monto integer DEFAULT 3000,
  estado text DEFAULT 'comision_pendiente',
  mp_preference_id text,
  mp_init_point text,
  mp_payment_id text,
  mp_payment_estado text,
  email_enviado boolean DEFAULT false,
  link_generado_at timestamptz,
  pagado_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_prestador ON reservas(prestador_id);
CREATE INDEX IF NOT EXISTS idx_reservas_dia ON reservas(dia);
CREATE INDEX IF NOT EXISTS idx_comisiones_reserva ON comisiones(reserva_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_prestador ON comisiones(prestador_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON comisiones(estado);

ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon lee reservas" ON reservas;
CREATE POLICY "anon lee reservas"
  ON reservas FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon actualiza reservas" ON reservas;
CREATE POLICY "anon actualiza reservas"
  ON reservas FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
