-- ============================================================
-- Prestadores: campos del modelo de leads/membresía + ranking.
--
-- Mapeo con el spec (para no duplicar columnas existentes):
--   isActive    -> enabled              (ya existe desde 20260428000002)
--   description -> descripcion          (ya existe)
--   photoUrl    -> foto_url             (ya existe)
--   serviceArea -> zona                 (ya existe)
--   joinedAt    -> created_at           (ya existe)
-- ============================================================

ALTER TABLE prestadores
  ADD COLUMN IF NOT EXISTS visibility_status text NOT NULL DEFAULT 'visible'
    CHECK (visibility_status IN ('visible', 'hidden', 'suspended')),
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS plan_phase text NOT NULL DEFAULT 'free_seed'
    CHECK (plan_phase IN ('free_seed', 'membership', 'mixed', 'premium')),
  ADD COLUMN IF NOT EXISTS membership_status text NOT NULL DEFAULT 'not_required'
    CHECK (membership_status IN ('not_required', 'trial', 'active', 'past_due', 'cancelled')),
  ADD COLUMN IF NOT EXISTS monthly_price numeric,
  ADD COLUMN IF NOT EXISTS discount_rate numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_top boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ranking_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_lead_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_leads integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_contacted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_budgets_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_confirmed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_no_show_or_no_progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS provider_token text UNIQUE DEFAULT fn_generar_token(),
  ADD COLUMN IF NOT EXISTS reactivation_fee_required boolean NOT NULL DEFAULT false;

-- Backfill de provider_token para filas creadas antes de existir el DEFAULT.
UPDATE prestadores SET provider_token = fn_generar_token()
  WHERE provider_token IS NULL;

ALTER TABLE prestadores ALTER COLUMN provider_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prestadores_provider_token ON prestadores(provider_token);
CREATE INDEX IF NOT EXISTS idx_prestadores_ranking_score ON prestadores(ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_prestadores_visibility ON prestadores(visibility_status);

-- ============================================================
-- Ranking score: función centralizada, pesos leídos de
-- configuracion_barrio.ranking_weights (editable desde admin).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_calcular_ranking_score(p_prestador_id uuid)
RETURNS integer AS $$
DECLARE
  p prestadores%ROWTYPE;
  w jsonb;
  fase text;
  score integer := 0;
  trabajos_activos_desactualizados integer;
  avisos_recientes integer;
BEGIN
  SELECT * INTO p FROM prestadores WHERE id = p_prestador_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT ranking_weights, current_business_phase INTO w, fase
    FROM configuracion_barrio WHERE id = 1;

  IF p.verification_status = 'verified' THEN
    score := score + (w->>'verified')::int;
  END IF;

  IF p.is_featured THEN
    score := score + (w->>'featured')::int;
  END IF;

  IF p.review_count > 0 AND p.average_rating >= 4.5 THEN
    score := score + (w->>'rating_ge_4_5')::int;
  END IF;

  IF p.review_count > 5 THEN
    score := score + (w->>'reviews_gt_5')::int;
  END IF;

  IF p.membership_status = 'active' THEN
    score := score + (w->>'active_membership')::int;
  END IF;

  SELECT count(*) INTO trabajos_activos_desactualizados
    FROM trabajos
    WHERE prestador_id = p_prestador_id
      AND estado NOT IN ('terminado', 'no_avanzo')
      AND estado_actualizado_at < now() - interval '3 days';

  IF trabajos_activos_desactualizados = 0 THEN
    score := score + (w->>'regular_updates')::int;
  ELSIF trabajos_activos_desactualizados >= 3 THEN
    score := score + (w->>'stale_jobs')::int;
  END IF;

  SELECT count(*) INTO avisos_recientes
    FROM sanciones_prestadores
    WHERE prestador_id = p_prestador_id
      AND tipo = 'warning'
      AND created_at > now() - interval '30 days';

  IF avisos_recientes > 0 THEN
    score := score + (w->>'recent_warning')::int;
  END IF;

  IF p.visibility_status = 'suspended' THEN
    score := score + (w->>'suspended')::int;
  END IF;

  IF p.membership_status = 'past_due' AND fase <> 'phase_0_seed' THEN
    score := score + (w->>'membership_overdue')::int;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_recalcular_ranking_prestador(p_prestador_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE prestadores
    SET ranking_score = fn_calcular_ranking_score(p_prestador_id)
    WHERE id = p_prestador_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Métricas del prestador: recalculadas por agregación (no por
-- contadores incrementales) cada vez que cambia un trabajo, para
-- que nunca puedan desincronizarse.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_actualizar_metricas_prestador()
RETURNS trigger AS $$
DECLARE
  v_prestador_id uuid;
BEGIN
  v_prestador_id := COALESCE(NEW.prestador_id, OLD.prestador_id);

  UPDATE prestadores SET
    total_leads = (SELECT count(*) FROM trabajos WHERE prestador_id = v_prestador_id),
    total_contacted = (SELECT count(*) FROM trabajos WHERE prestador_id = v_prestador_id AND estado <> 'nuevo_contacto'),
    total_budgets_sent = (SELECT count(*) FROM trabajos WHERE prestador_id = v_prestador_id AND estado IN ('presupuesto_enviado', 'confirmado', 'terminado')),
    total_confirmed = (SELECT count(*) FROM trabajos WHERE prestador_id = v_prestador_id AND estado IN ('confirmado', 'terminado')),
    total_completed = (SELECT count(*) FROM trabajos WHERE prestador_id = v_prestador_id AND estado = 'terminado'),
    total_no_show_or_no_progress = (SELECT count(*) FROM trabajos WHERE prestador_id = v_prestador_id AND estado = 'no_avanzo'),
    last_lead_at = (SELECT max(created_at) FROM trabajos WHERE prestador_id = v_prestador_id)
    WHERE id = v_prestador_id;

  PERFORM fn_recalcular_ranking_prestador(v_prestador_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trabajos_actualizar_metricas ON trabajos;
CREATE TRIGGER trg_trabajos_actualizar_metricas
  AFTER INSERT OR UPDATE OF estado ON trabajos
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_metricas_prestador();

-- Recalcular ranking también cuando cambian campos de prestadores que
-- lo afectan directamente (verificación, destacado, membresía, visibilidad).
CREATE OR REPLACE FUNCTION fn_prestador_recalcular_en_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.membership_status IS DISTINCT FROM OLD.membership_status
     OR NEW.visibility_status IS DISTINCT FROM OLD.visibility_status THEN
    NEW.ranking_score := fn_calcular_ranking_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prestadores_recalcular_ranking ON prestadores;
CREATE TRIGGER trg_prestadores_recalcular_ranking
  BEFORE UPDATE ON prestadores
  FOR EACH ROW EXECUTE FUNCTION fn_prestador_recalcular_en_update();

-- Recalcular ranking cuando se crea/resuelve una sanción.
CREATE OR REPLACE FUNCTION fn_sancion_recalcular_ranking()
RETURNS trigger AS $$
BEGIN
  PERFORM fn_recalcular_ranking_prestador(COALESCE(NEW.prestador_id, OLD.prestador_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sanciones_recalcular_ranking ON sanciones_prestadores;
CREATE TRIGGER trg_sanciones_recalcular_ranking
  AFTER INSERT OR UPDATE ON sanciones_prestadores
  FOR EACH ROW EXECUTE FUNCTION fn_sancion_recalcular_ranking();
