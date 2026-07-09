-- ============================================================
-- valoraciones: formaliza el modelo de Reseña del nuevo flujo.
-- Esta tabla nunca tuvo una migración versionada ni RLS (mismo tipo
-- de brecha que causó el incidente de prestadores falsos de junio:
-- ver LIMPIEZA_PRESTADORES.sql / 20260621000000_prestadores_rls.sql).
-- Hoy se inserta directo con la anon key desde src/pages/usuarios/page.tsx.
-- A partir de esta migración, todas las escrituras pasan por Edge
-- Functions (crear-resena, admin-prestador) con service_role.
-- ============================================================

ALTER TABLE valoraciones
  ADD COLUMN IF NOT EXISTS trabajo_id uuid REFERENCES trabajos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('post_job_review', 'manual', 'imported')),
  ADD COLUMN IF NOT EXISTS admin_approved boolean NOT NULL DEFAULT true;

-- NOT VALID para no romper si hay filas viejas con puntuacion fuera de rango;
-- se puede validar aparte (VALIDATE CONSTRAINT) tras auditar los datos.
ALTER TABLE valoraciones DROP CONSTRAINT IF EXISTS valoraciones_puntuacion_check;
ALTER TABLE valoraciones
  ADD CONSTRAINT valoraciones_puntuacion_check CHECK (puntuacion BETWEEN 1 AND 5) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_valoraciones_prestador ON valoraciones(prestador_id);
CREATE INDEX IF NOT EXISTS idx_valoraciones_trabajo ON valoraciones(trabajo_id);

ALTER TABLE valoraciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "valoraciones_select_visibles" ON valoraciones;
CREATE POLICY "valoraciones_select_visibles"
  ON valoraciones FOR SELECT
  TO anon
  USING (is_visible = true);

DROP POLICY IF EXISTS "valoraciones_service_role_all" ON valoraciones;
CREATE POLICY "valoraciones_service_role_all"
  ON valoraciones FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Sin policy de INSERT/UPDATE/DELETE para anon: cierra la brecha
-- actual (usuarios/page.tsx insertaba directo con la anon key).

-- ── Rating agregado del prestador, recalculado desde valoraciones visibles ──
CREATE OR REPLACE FUNCTION fn_actualizar_rating_prestador()
RETURNS trigger AS $$
DECLARE
  v_prestador_id uuid;
BEGIN
  v_prestador_id := COALESCE(NEW.prestador_id, OLD.prestador_id);

  UPDATE prestadores SET
    average_rating = COALESCE((
      SELECT round(avg(puntuacion)::numeric, 2) FROM valoraciones
      WHERE prestador_id = v_prestador_id AND is_visible = true
    ), 0),
    review_count = (
      SELECT count(*) FROM valoraciones
      WHERE prestador_id = v_prestador_id AND is_visible = true
    )
    WHERE id = v_prestador_id;

  PERFORM fn_recalcular_ranking_prestador(v_prestador_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_valoraciones_actualizar_rating ON valoraciones;
CREATE TRIGGER trg_valoraciones_actualizar_rating
  AFTER INSERT OR UPDATE OR DELETE ON valoraciones
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_rating_prestador();
