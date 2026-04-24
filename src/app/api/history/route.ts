import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get all services for this project
  const { data: services } = await supabase
    .from('services')
    .select('id, name, region')
    .eq('project_id', projectId);

  if (!services || services.length === 0) {
    return NextResponse.json({ regions: [] });
  }

  const serviceIds = services.map(s => s.id);

  // We are now fetching 7 days instead of 90 days.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: statuses, error } = await supabase
    .from('statuses')
    .select('service_id, status, response_time, checked_at')
    .in('service_id', serviceIds)
    .gte('checked_at', sevenDaysAgo.toISOString())
    .order('checked_at', { ascending: false })
    .limit(50000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const regionMap: Record<string, any> = {};

  services.forEach(s => {
    const r = s.region || 'global';
    if (!regionMap[r]) {
      regionMap[r] = {
        id: r,
        name: r.toUpperCase() + ' Region',
        services: [],
        hourlyMap: {}
      };
    }
    regionMap[r].services.push(s.id);
  });

  if (statuses) {
    statuses.forEach(st => {
      const srv = services.find(s => s.id === st.service_id);
      if (!srv) return;
      const r = srv.region || 'global';
      
      const dateObj = new Date(st.checked_at);
      const dayStr = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
      const hour = dateObj.getHours();
      
      const key = `${dayStr}-${hour}`;
      if (!regionMap[r].hourlyMap[key]) {
        regionMap[r].hourlyMap[key] = {
          count: 0,
          downCount: 0,
          degradedCount: 0,
          totalLatency: 0,
          firstDegradedAt: null,
          firstDownAt: null
        };
      }

      const h = regionMap[r].hourlyMap[key];
      h.count++;
      h.totalLatency += st.response_time;
      if (st.status === 'down') {
        h.downCount++;
        if (!h.firstDownAt || dateObj < h.firstDownAt) h.firstDownAt = dateObj;
      }
      else if (st.status === 'degraded') {
        h.degradedCount++;
        if (!h.firstDegradedAt || dateObj < h.firstDegradedAt) h.firstDegradedAt = dateObj;
      }
    });
  }

  const resultRegions = Object.keys(regionMap).map(r => {
    const hMap = regionMap[r].hourlyMap;
    const dailyData = [];
    
    const today = new Date();
    // Loop only 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
      
      const hours = [];
      for (let h = 0; h < 24; h++) {
        const key = `${dayStr}-${h}`;
        const agg = hMap[key];
        
        if (!agg) {
          hours.push({
            hour: h,
            uptime: 100,
            status: "operational",
            latency: 0,
            incidentCount: 0,
            noData: true
          });
        } else {
          // If a SINGLE check was degraded/down in that hour, the WHOLE hour is marked as such.
          let status = "operational";
          let eventTime = null;

          if (agg.downCount > 0) {
            status = "down";
            eventTime = agg.firstDownAt.toISOString();
          } else if (agg.degradedCount > 0) {
            status = "degraded";
            eventTime = agg.firstDegradedAt.toISOString();
          }
          
          let uptime = 100;
          if (agg.downCount > 0) {
            uptime = Math.max(0, 100 - ((agg.downCount / agg.count) * 100));
          } else if (agg.degradedCount > 0) {
            uptime = Math.max(0, 100 - ((agg.degradedCount / agg.count) * 10));
          }

          hours.push({
            hour: h,
            uptime: uptime,
            status,
            latency: Math.round(agg.totalLatency / agg.count),
            incidentCount: agg.downCount,
            eventTime
          });
        }
      }
      
      dailyData.push({
        date,
        dateStr: dayStr,
        hours
      });
    }

    return {
      id: r,
      name: regionMap[r].name,
      data: dailyData
    };
  });

  return NextResponse.json({ regions: resultRegions });
}
