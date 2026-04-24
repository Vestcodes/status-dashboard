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
      const start = Date.now();
      let isUp = false;
      let statusCode = 0;
      let latencyMs = 0;
      let ttfbMs = 0;
      
      // Determine method (some might need GET to trace full payload, defaults to HEAD for bandwidth)
      // If service.type is 'api_full', we could use GET, otherwise HEAD. 
      // For now we'll do GET if explicitly asked, else HEAD. We assume HEAD for standard pings.
      const method = service.meta?.method || 'HEAD';
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Measure TTFB manually using the Response object's first byte arrival
        const response = await fetch(service.endpoint, {
          method: method,
          headers: { 
            "User-Agent": "Vestcodes-Vercel-Edge-Cron/4.0",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          },
          signal: controller.signal
        });
        
        // At this point headers have arrived = TTFB
        ttfbMs = Date.now() - start;
        
        // Actually consume the body if it's a GET, otherwise just wait for finish
        if (method === 'GET') {
           await response.text(); 
        } else {
           await response.blob(); 
        }

        clearTimeout(timeoutId);
        statusCode = response.status;
        isUp = response.ok;
        latencyMs = Date.now() - start; // Total Request Time
      } catch (error) {
        isUp = false;
        latencyMs = Date.now() - start;
        ttfbMs = latencyMs; // Approximate if failed before headers
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
