import { createClient } from '@supabase/supabase-js';

export async function executePing(executionRegion: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials (SUPABASE_SERVICE_ROLE_KEY is required)');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: services, error: fetchError } = await supabase
    .from('services')
    .select('*')
    .not('endpoint', 'is', null);

  if (fetchError) throw fetchError;
  if (!services || services.length === 0) return { message: 'No services to monitor' };

  const results = await Promise.all(
    services.map(async (service) => {
      const start = Date.now();
      let isUp = false;
      let statusCode = 0;
      let latencyMs = 0;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(service.endpoint, {
          method: 'HEAD',
          headers: { 
            "User-Agent": "Vestcodes-Vercel-Edge-Cron/3.0",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        statusCode = response.status;
        isUp = response.ok;
        latencyMs = Date.now() - start;
      } catch (error) {
        isUp = false;
        latencyMs = Date.now() - start;
      }

      let statusStr = 'operational';
      if (!isUp) statusStr = 'down';
      else if (latencyMs > 2000) statusStr = 'degraded';

      return {
        service_id: service.id,
        status: statusStr,
        response_time: latencyMs,
        meta: { statusCode, timestamp: new Date().toISOString(), region: executionRegion }
      };
    })
  );

  const { error: insertError } = await supabase
    .from('statuses')
    .insert(results);

  if (insertError) throw insertError;

  return { success: true, count: results.length, region: executionRegion };
}
