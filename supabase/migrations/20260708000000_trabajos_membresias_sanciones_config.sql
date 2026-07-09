-- ============================================================
-- Modelo de leads/membresía (etapa 2, ver modeloActualizado.md).
-- Tablas nuevas: trabajos (leads), membresias, sanciones_prestadores,
-- configuracion_barrio. Ninguna tiene policy anon: todo acceso público
-- pasa por Edge Functions con service_role que validan tokens a mano.
-- ============================================================

-- Token largo y no adivinable sin depender de pgcrypto (cuya ubicación de
-- esquema varía entre proyectos Supabase) — gen_random_uuid() es nativo
-- de Postgres desde la v13. 2 UUIDs sin guiones = 64 hex chars (256 bits).
CREATE OR REPLACE FUNCTION fn_generar_token()
RETURNS text AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$ LANGUAGE sql VOLATILE;

-- ── trabajos (Lead / ServiceRequest) ───────────────────────────
CREATE TABLE IF NOT EXISTS trabajos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  vecino_nombre text NOT NULL,
  vecino_telefono text NOT NULL,
  vecino_direccion text,
  categoria text,
  servicio_descripcion text,
  source text NOT NULL DEFAULT 'public_site'
    CHECK (source IN ('public_site', 'admin_manual', 'whatsapp', 'other')),
  estado text NOT NULL DEFAULT 'nuevo_contacto'
    CHECK (estado IN ('nuevo_contacto', 'contactado', 'presupuesto_enviado', 'confirmado', 'terminado', 'no_avanzo')),
  estado_actualizado_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  completado_at timestamptz,
  job_token text NOT NULL UNIQUE DEFAULT fn_generar_token(),
  review_token text NOT NULL UNIQUE DEFAULT fn_generar_token(),
  admin_validation_status text NOT NULL DEFAULT 'not_checked'
    CHECK (admin_validation_status IN ('not_checked', 'confirmed_by_review', 'manually_confirmed', 'disputed', 'false_report')),
  review_requested_at timestamptz,
  review_received_at timestamptz,
  notes text,
  close_code text
);

CREATE INDEX IF NOT EXISTS idx_trabajos_prestador ON trabajos(prestador_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos(estado);
CREATE INDEX IF NOT EXISTS idx_trabajos_job_token ON trabajos(job_token);
CREATE INDEX IF NOT EXISTS idx_trabajos_review_token ON trabajos(review_token);
CREATE INDEX IF NOT EXISTS idx_trabajos_created_at ON trabajos(created_at);

ALTER TABLE trabajos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trabajos_service_role_all"
  ON trabajos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Sin policy anon: crear lead, ver/actualizar por token y listar en admin
-- pasan todos por Edge Functions (crear-lead, obtener-trabajo,
-- actualizar-estado-trabajo, admin-trabajos).

-- ── membresias ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membresias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  amount numeric NOT NULL,
  discount_applied numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  estado text NOT NULL DEFAULT 'pending'
    CHECK (estado IN ('pending', 'paid', 'overdue', 'waived')),
  payment_link text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membresias_prestador ON membresias(prestador_id);
CREATE INDEX IF NOT EXISTS idx_membresias_estado ON membresias(estado);

ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membresias_service_role_all"
  ON membresias FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── sanciones_prestadores ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sanciones_prestadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CHECK (tipo IN ('reminder', 'warning', 'ranking_drop', 'temporary_suspension', 'permanent_ban')),
  reason text,
  related_trabajo_id uuid REFERENCES trabajos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  admin_notes text
);

CREATE INDEX IF NOT EXISTS idx_sanciones_prestador ON sanciones_prestadores(prestador_id);
CREATE INDEX IF NOT EXISTS idx_sanciones_created_at ON sanciones_prestadores(created_at);

ALTER TABLE sanciones_prestadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sanciones_service_role_all"
  ON sanciones_prestadores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── configuracion_barrio (singleton) ─────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_barrio (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  neighborhood_name text NOT NULL DEFAULT 'San Isidro',
  city text NOT NULL DEFAULT 'Villa Allende',
  official_status text NOT NULL DEFAULT 'independent'
    CHECK (official_status IN ('independent', 'recommended', 'official')),
  current_business_phase text NOT NULL DEFAULT 'phase_0_seed'
    CHECK (current_business_phase IN ('phase_0_seed', 'phase_1_membership', 'phase_2_mixed')),
  free_lead_threshold int NOT NULL DEFAULT 5,
  default_monthly_price numeric NOT NULL DEFAULT 12000,
  featured_price numeric,
  reactivation_fee numeric,
  whatsapp_business_number text,
  enable_close_code boolean NOT NULL DEFAULT false,
  enable_membership_payments boolean NOT NULL DEFAULT false,
  enable_featured_providers boolean NOT NULL DEFAULT true,
  enable_public_reviews boolean NOT NULL DEFAULT true,
  ranking_weights jsonb NOT NULL DEFAULT '{
    "verified": 30,
    "featured": 20,
    "rating_ge_4_5": 15,
    "reviews_gt_5": 10,
    "regular_updates": 10,
    "active_membership": 10,
    "recent_warning": -30,
    "suspended": -100,
    "membership_overdue": -50,
    "stale_jobs": -20
  }'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO configuracion_barrio (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE configuracion_barrio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "configuracion_barrio_service_role_all"
  ON configuracion_barrio FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Sin policy anon en la tabla base: solo se expone lo no sensible
-- via la vista v_config_publica de abajo.

-- ── Vista pública (home, badges, gating de "oficial") ────────────
CREATE OR REPLACE VIEW v_config_publica AS
  SELECT
    neighborhood_name,
    city,
    official_status,
    enable_featured_providers,
    enable_public_reviews
  FROM configuracion_barrio
  WHERE id = 1;

GRANT SELECT ON v_config_publica TO anon;
