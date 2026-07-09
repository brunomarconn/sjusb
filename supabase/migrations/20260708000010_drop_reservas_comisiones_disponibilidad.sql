-- ============================================================
-- Fin del modelo viejo (reservas por calendario + comisión fija
-- de $3.000 por trabajo). Reemplazado por el modelo de leads +
-- membresía (ver 20260708000000/1/2 y modeloActualizado.md).
--
-- Se corre AL FINAL, después de que todo el código (frontend y
-- Edge Functions) dejó de referenciar estas tablas y el cron.
-- ============================================================

SELECT cron.unschedule('procesar-comisiones-vencidas-diario');

DROP TABLE IF EXISTS comisiones CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS disponibilidad_prestadores CASCADE;

-- La extensión pg_cron queda habilitada por si se reutiliza a futuro
-- (por ejemplo, para recordatorios automáticos o vencimiento de membresías).
