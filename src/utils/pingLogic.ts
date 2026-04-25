import { createClient } from '@supabase/supabase-js';

export async function executePing(executionRegion: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
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
      let isUp = false;
      let statusCode = 0;
      let latencyMs = 0;
      let ttfbMs = 0;
      const method = service.meta?.method || 'HEAD';
      
      const maxRetries = 2; // Up to 3 attempts total (1 initial + 2 retries)
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(service.endpoint, {
            method: method,
            headers: { 
              "User-Agent": "Vestcodes-Vercel-Edge-Cron/5.0",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            },
            signal: controller.signal
          });
          
          ttfbMs = Date.now() - start;
          
          if (method === 'GET') {
             await response.text(); 
          } else {
             await response.blob(); 
          }

          clearTimeout(timeoutId);
          statusCode = response.status;
          isUp = response.ok;
          latencyMs = Date.now() - start;
          
          // If successful, we don't need to retry
          if (isUp) break;
          
        } catch (error) {
          isUp = false;
          latencyMs = Date.now() - start;
          ttfbMs = latencyMs;
        }
        
        // If it's a failure (either HTTP 5xx/4xx or network throw), and we have retries left, wait and retry
        if (!isUp && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // wait 1.5s before retry
        }
      }

      let statusStr = 'operational';
      if (!isUp) statusStr = 'down';
      else if (latencyMs > 2000) statusStr = 'degraded';

      return {
        service_id: service.id,
        status: statusStr,
        response_time: latencyMs,
        meta: { 
          statusCode, 
          timestamp: new Date().toISOString(), 
          region: executionRegion,
          ttfb: ttfbMs,
          method
        }
      };
    })
  );

  const { error: insertError } = await supabase
    .from('statuses')
    .insert(results);

  if (insertError) throw insertError;

  return { success: true, count: results.length, region: executionRegion };
}
