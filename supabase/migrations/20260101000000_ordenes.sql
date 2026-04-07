-- ============================================================
-- MServicios — Sistema de Órdenes y Pagos
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLA PRINCIPAL: ordenes
-- Una orden representa un servicio contratado con su ciclo de vida
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordenes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partes involucradas
  cliente_dni             TEXT NOT NULL,
  cliente_email           TEXT,
  prestador_id            UUID NOT NULL REFERENCES prestadores(id) ON DELETE RESTRICT,

  -- Descripción del servicio
  titulo                  TEXT NOT NULL,
  descripcion             TEXT,

  -- Montos (en ARS)
  monto_bruto             DECIMAL(12,2) NOT NULL CHECK (monto_bruto > 0),
  monto_prestador         DECIMAL(12,2) NOT NULL CHECK (monto_prestador >= 0),
  monto_comision          DECIMAL(12,2) NOT NULL CHECK (monto_comision >= 0),
  porcentaje_comision     DECIMAL(5,2)  NOT NULL DEFAULT 15.00,

  -- Estado del ciclo de vida
  -- draft → payment_pending → paid_pending_service → service_completed → released
  --                        ↘ cancelled               ↘ refunded
  estado                  TEXT NOT NULL DEFAULT 'draft' CHECK (estado IN (
    'draft',
    'payment_pending',
    'paid_pending_service',
    'service_completed',
    'released',
    'cancelled',
    'refunded'
  )),

  -- Datos del pago externo
  pago_proveedor          TEXT NOT NULL DEFAULT 'mock',  -- 'mock' | 'mercadopago'
  pago_preferencia_id     TEXT,                          -- ID de preferencia MP
  pago_referencia_externa TEXT UNIQUE,                   -- ID del pago en MP
  pago_link               TEXT,                          -- URL de pago
  pago_metadata           JSONB DEFAULT '{}',

  -- Timestamps del ciclo
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at                 TIMESTAMPTZ,
  service_completed_at    TIMESTAMPTZ,
  released_at             TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,

  -- Integridad: monto_prestador + monto_comision debe ≈ monto_bruto
  CONSTRAINT monto_balance_check CHECK (
    ABS((monto_prestador + monto_comision) - monto_bruto) < 0.02
  )
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: orden_eventos
-- Historial inmutable de cada acción sobre una orden (audit trail)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orden_eventos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id        UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,

  -- Tipo de evento: orden_creada | pago_generado | pago_confirmado |
  --   pago_rechazado | servicio_completado | fondos_liberados |
  --   orden_cancelada | pago_reembolsado
  tipo            TEXT NOT NULL,

  estado_anterior TEXT,
  estado_nuevo    TEXT,
  datos           JSONB DEFAULT '{}',

  -- Quién disparó el evento: 'admin' | 'cliente' | 'prestador' | 'webhook' | 'sistema' | 'mock'
  creado_por      TEXT DEFAULT 'sistema',
  ip_origen       TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: liquidaciones
-- Registro de la liberación de fondos al prestador
-- Una orden → máximo una liquidación
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liquidaciones (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id                 UUID NOT NULL UNIQUE REFERENCES ordenes(id) ON DELETE RESTRICT,
  prestador_id             UUID NOT NULL REFERENCES prestadores(id),

  monto_prestador          DECIMAL(12,2) NOT NULL,
  monto_comision           DECIMAL(12,2) NOT NULL,

  -- 'manual' | 'transferencia' | 'mercadopago_transfer'
  metodo_liquidacion       TEXT NOT NULL DEFAULT 'manual',
  referencia_transferencia TEXT,  -- Número de transferencia bancaria o ID de MP

  estado                   TEXT NOT NULL DEFAULT 'pending' CHECK (estado IN (
    'pending', 'completed', 'failed'
  )),

  notas                    TEXT,
  ejecutado_por            TEXT,  -- DNI del admin que ejecutó

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  ejecutado_at             TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES para búsquedas frecuentes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_dni        ON ordenes(cliente_dni);
CREATE INDEX IF NOT EXISTS idx_ordenes_prestador_id       ON ordenes(prestador_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado             ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_created_at         ON ordenes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_referencia    ON ordenes(pago_referencia_externa) WHERE pago_referencia_externa IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orden_eventos_orden_id     ON orden_eventos(orden_id);
CREATE INDEX IF NOT EXISTS idx_orden_eventos_created_at   ON orden_eventos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_orden_id     ON liquidaciones(orden_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_prestador_id ON liquidaciones(prestador_id);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: updated_at automático en ordenes
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ordenes_updated_at ON ordenes;
CREATE TRIGGER trg_ordenes_updated_at
  BEFORE UPDATE ON ordenes
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Las Edge Functions usan service_role (bypass RLS).
-- La anon key solo puede leer, nunca escribir directamente.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ordenes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

-- Service role: acceso total (para Edge Functions)
CREATE POLICY "service_role_ordenes_all"
  ON ordenes TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_eventos_all"
  ON orden_eventos TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_liquidaciones_all"
  ON liquidaciones TO service_role USING (true) WITH CHECK (true);

-- Anon key: solo lectura de órdenes (el filtro por DNI se hace en la app)
-- NOTA: Cuando implementes Supabase Auth, reemplazá con: USING (auth.jwt()->>'sub' = cliente_dni)
CREATE POLICY "anon_ordenes_select"
  ON ordenes FOR SELECT TO anon USING (true);

CREATE POLICY "anon_eventos_select"
  ON orden_eventos FOR SELECT TO anon USING (true);

-- Liquidaciones: solo admin (service_role) puede verlas
-- No se exponen al anon key por seguridad financiera

-- ─────────────────────────────────────────────────────────────
-- VISTAS útiles para reportes rápidos en el dashboard de Supabase
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_resumen_ordenes AS
SELECT
  estado,
  COUNT(*)                        AS cantidad,
  COALESCE(SUM(monto_bruto), 0)   AS total_bruto,
  COALESCE(SUM(monto_comision), 0) AS total_comision,
  COALESCE(SUM(monto_prestador), 0) AS total_prestadores
FROM ordenes
GROUP BY estado;

-- ─────────────────────────────────────────────────────────────
-- DATOS DE VERIFICACIÓN (opcional — para confirmar que todo quedó bien)
-- Descomentar para chequear después de ejecutar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ordenes','orden_eventos','liquidaciones');
-- SELECT * FROM v_resumen_ordenes;
-- ─────────────────────────────────────────────────────────────
