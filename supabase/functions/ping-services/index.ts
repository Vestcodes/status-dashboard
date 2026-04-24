import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // We need the Vercel dashboard URL to ping the API routes
    // Fallback to the production domain if env var isn't set in Supabase
    const dashboardUrl = Deno.env.get('DASHBOARD_URL') || 'https://status.vestcodes.co';
    const cronSecret = Deno.env.get('CRON_SECRET') || '';

    const regions = [
      'arn1', 'bom1', 'cdg1', 'cle1', 'cpt1', 'dub1', 'dxb1', 'fra1',
      'gru1', 'hkg1', 'hnd1', 'iad1', 'icn1', 'kix1', 'lhr1', 'pdx1',
      'sfo1', 'sin1', 'syd1', 'yul1'
    ];

    // The Supabase Edge Function acts as the fan-out dispatcher,
    // triggering the Vercel Edge endpoints to execute their localized pings.
    const promises = regions.map(async (region) => {
      try {
        const response = await fetch(`${dashboardUrl}/api/ping/${region}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cronSecret}`
          }
        });
        return { region, status: response.status, ok: response.ok };
      } catch (e: any) {
        return { region, error: e.message };
      }
    });

    const results = await Promise.all(promises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Fan-out to 20 Vercel regional endpoints initiated from Supabase Edge',
        results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
