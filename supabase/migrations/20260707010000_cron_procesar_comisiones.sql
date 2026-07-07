-- ============================================================
-- Automatiza el procesamiento de reservas vencidas -> comisiones.
-- Corre 1 vez por día; el secreto usado para autenticar la llamada
-- se lee de Supabase Vault por nombre ('cron_secret'), nunca queda
-- en texto plano en este archivo.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'procesar-comisiones-vencidas-diario',
  '0 9 * * *', -- 09:00 UTC = 06:00 Argentina
  $$
  SELECT net.http_post(
    url := 'https://ocoinzmtxeembyeyvbsh.supabase.co/functions/v1/procesar-comisiones-automatico',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
