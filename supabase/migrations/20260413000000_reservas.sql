-- ─────────────────────────────────────────────────────────────
-- Disponibilidad de prestadores y reservas
-- ─────────────────────────────────────────────────────────────

-- Disponibilidad semanal del prestador
-- dia_semana sigue la convención de JS Date.getDay():
--   0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles,
--   4 = Jueves, 5 = Viernes, 6 = Sábado
CREATE TABLE IF NOT EXISTS disponibilidad_prestadores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  dia_semana   SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  turno        TEXT NOT NULL CHECK (turno IN ('mañana', 'tarde')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (prestador_id, dia_semana, turno)
);

-- Reservas realizadas por usuarios
CREATE TABLE IF NOT EXISTS reservas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES prestadores(id),
  nombre       TEXT NOT NULL,
  apellido     TEXT NOT NULL,
  telefono     TEXT NOT NULL,
  dia          DATE NOT NULL,
  turno        TEXT NOT NULL CHECK (turno IN ('mañana', 'tarde')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ────────────────────────────────────────────────────────

ALTER TABLE disponibilidad_prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Disponibilidad: lectura pública (para mostrar slots en la página de reserva)
CREATE POLICY "anon lee disponibilidad"
  ON disponibilidad_prestadores FOR SELECT
  USING (true);

-- Disponibilidad: escritura pública (prestador actualiza desde su panel con anon key)
CREATE POLICY "anon gestiona disponibilidad"
  ON disponibilidad_prestadores FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reservas: solo inserción pública (el usuario crea su reserva)
CREATE POLICY "anon inserta reservas"
  ON reservas FOR INSERT
  WITH CHECK (true);

-- Reservas: lectura y gestión completa para service_role (admin, emails, etc.)
CREATE POLICY "service gestiona reservas"
  ON reservas FOR ALL
  TO service_role
  USING (true);
