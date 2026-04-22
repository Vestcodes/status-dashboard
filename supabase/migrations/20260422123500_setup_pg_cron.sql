CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Unschedule if it exists
  PERFORM cron.unschedule('ping-services-every-minute');
EXCEPTION WHEN OTHERS THEN
  -- ignore
END $$;

SELECT cron.schedule(
  'ping-services-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
      url := 'https://pvxfpphlxygxdlirqaxf.supabase.co/functions/v1/ping-services'
  )
  $$
);
