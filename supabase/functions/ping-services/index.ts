import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response("Missing env vars", { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch active services that have an endpoint
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .not('endpoint', 'is', null)

    if (fetchError) throw fetchError
    if (!services || services.length === 0) {
      return new Response(JSON.stringify({ message: 'No services to monitor' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = await Promise.all(
      services.map(async (service) => {
        const start = Date.now()
        let isUp = false
        let statusCode = 0
        let latencyMs = 0
        
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          
          const response = await fetch(service.endpoint, {
            method: 'HEAD',
            headers: { "User-Agent": "Vestcodes-Status-Cron/2.0" },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          statusCode = response.status
          isUp = response.ok
          latencyMs = Date.now() - start
        } catch (error) {
          isUp = false
          latencyMs = Date.now() - start
        }

        let statusStr = 'operational'
        if (!isUp) statusStr = 'down'
        else if (latencyMs > 2000) statusStr = 'degraded'

        return {
          service_id: service.id,
          status: statusStr,
          response_time: latencyMs,
          meta: { statusCode, timestamp: new Date().toISOString() }
        }
      })
    )

    // Insert results into statuses table
    const { error: insertError } = await supabase
      .from('statuses')
      .insert(results)

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, count: results.length }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
