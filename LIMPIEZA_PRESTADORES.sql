-- ============================================================
-- LIMPIEZA DE PRESTADORES FALSOS
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── PASO 1: VER todos los prestadores ordenados por fecha ───
-- Usá esto para identificar cuáles son los reales (los tuyos)
-- y cuáles son los falsos.
SELECT
  id,
  nombre,
  apellido,
  dni,
  email,
  categoria,
  zona,
  created_at
FROM prestadores
ORDER BY created_at ASC;


-- ── PASO 2: PREVIEW de candidatos a eliminar ────────────────
-- Esta query muestra los prestadores con nombres de prueba.
-- Revisá la lista ANTES de eliminar para asegurarte de que
-- no haya ninguno real entre ellos.
SELECT
  id,
  nombre,
  apellido,
  dni,
  email,
  created_at
FROM prestadores
WHERE
  nombre ILIKE '%test%'
  OR nombre ILIKE '%workflow%'
  OR nombre ILIKE '%probe%'
  OR nombre ILIKE '%prueba%'
  OR nombre ILIKE '%gradefour%'
  OR nombre ILIKE '%cleanup%'
  OR nombre ILIKE '%tester%'
  OR apellido ILIKE '%test%'
  OR apellido ILIKE '%workflow%'
  OR apellido ILIKE '%probe%'
  OR apellido = 'x'
ORDER BY created_at DESC;


-- ── PASO 3: ELIMINAR los falsos ─────────────────────────────
-- Solo ejecutar DESPUÉS de revisar el paso 2.
-- Si queda algún prestador real en el resultado del paso 2,
-- excluí su ID con: AND id != 'uuid-del-real'

DELETE FROM prestadores
WHERE
  nombre ILIKE '%test%'
  OR nombre ILIKE '%workflow%'
  OR nombre ILIKE '%probe%'
  OR nombre ILIKE '%prueba%'
  OR nombre ILIKE '%gradefour%'
  OR nombre ILIKE '%cleanup%'
  OR nombre ILIKE '%tester%'
  OR apellido ILIKE '%test%'
  OR apellido ILIKE '%workflow%'
  OR apellido ILIKE '%probe%'
  OR apellido = 'x';


-- ── ALTERNATIVA: eliminar por rango de fecha ────────────────
-- Si sabés aproximadamente cuándo empezaron a aparecer los falsos,
-- podés eliminar todo lo creado después de esa fecha.
-- Reemplazá '2026-05-20' con la fecha real.

-- DELETE FROM prestadores
-- WHERE created_at > '2026-05-20 00:00:00+00'
-- AND id NOT IN (
--   'uuid-prestador-real-1',
--   'uuid-prestador-real-2'
-- );
