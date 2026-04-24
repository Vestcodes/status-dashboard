import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Secure the cron endpoint using Vercel's CRON_SECRET if provided
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires service_role key to bypass RLS for insertions
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials (SUPABASE_SERVICE_ROLE_KEY is required)' }, { status: 500 });
  }

  // Extract Vercel Region (e.g. iad1, fra1, bom1)
  const executionRegion = process.env.VERCEL_REGION || 'global';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch active services that have an endpoint
  const { data: services, error: fetchError } = await supabase
    .from('services')
    .select('*')
    .not('endpoint', 'is', null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!services || services.length === 0) {
    return NextResponse.json({ message: 'No services to monitor' });
  }

  const results = await Promise.all(
    services.map(async (service) => {
      const start = Date.now();
      let isUp = false;
      let statusCode = 0;
      let latencyMs = 0;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(service.endpoint, {
          method: 'HEAD',
          headers: { "User-Agent": "Vestcodes-Vercel-Edge-Cron/3.0" },
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

  // Insert results into statuses table
  const { error: insertError } = await supabase
    .from('statuses')
    .insert(results);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: results.length, region: executionRegion });
}
