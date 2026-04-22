import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel cron secrets
const CRON_SECRET = process.env.CRON_SECRET;

// We use service_role here because cron runs in the background and needs to bypass RLS to write to statuses table
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  // 1. Verify cron secret to prevent unauthorized execution
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch all services that have endpoints configured
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .not('endpoint', 'is', null);

    if (fetchError) throw fetchError;
    if (!services || services.length === 0) {
      return NextResponse.json({ message: 'No services to monitor' });
    }

    // 3. Ping endpoints (we'll use the local latency API to utilize its region/ssrf checks, or ping directly)
    // To ensure region-aware fetching, the ideal way is to have the cron trigger regional edge functions.
    // For now, we will perform a standard fetch to the endpoints and record the latency.
    
    const results = await Promise.all(
      services.map(async (service) => {
        const start = Date.now();
        let isUp = false;
        let statusCode = 0;
        let latencyMs = 0;
        
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          const response = await fetch(service.endpoint, {
            method: 'HEAD',
            headers: { "User-Agent": "Vestcodes-Status-Cron/1.0" },
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

        // Determine status string based on result
        let statusStr = 'operational';
        if (!isUp) statusStr = 'down';
        else if (latencyMs > 2000) statusStr = 'degraded'; // Arbitrary threshold for degraded

        return {
          service_id: service.id,
          status: statusStr,
          response_time: latencyMs,
          meta: { statusCode, timestamp: new Date().toISOString() }
        };
      })
    );

    // 4. Insert results into statuses table
    const { error: insertError } = await supabase
      .from('statuses')
      .insert(results);

    if (insertError) throw insertError;

    // Optional: We should probably keep only the latest X statuses per service to avoid DB bloat, 
    // but for now we'll just insert and let a separate cleanup job handle rotation.

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Cron execution failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
