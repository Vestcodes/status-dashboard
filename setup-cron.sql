SELECT cron.schedule(
  'invoke-ping-services',
  '* * * * *',
  $$
    SELECT net.http_post(
      url:='https://pvxfpphlxygxdlirqaxf.supabase.co/functions/v1/ping-services',
      headers:='{"Content-Type": "application/json"}'::jsonb
    );
  $$
);
