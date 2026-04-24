import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const VERCEL_REGIONS: Record<string, string> = {
  'arn1': 'Stockholm, Sweden (arn1)',
  'bom1': 'Mumbai, India (bom1)',
  'cdg1': 'Paris, France (cdg1)',
  'cle1': 'Cleveland, USA (cle1)',
  'cpt1': 'Cape Town, South Africa (cpt1)',
  'dub1': 'Dublin, Ireland (dub1)',
  'fra1': 'Frankfurt, Germany (fra1)',
  'gru1': 'São Paulo, Brazil (gru1)',
  'hkg1': 'Hong Kong (hkg1)',
  'hnd1': 'Tokyo, Japan (hnd1)',
  'iad1': 'Washington, D.C., USA (iad1)',
  'icn1': 'Seoul, South Korea (icn1)',
  'kix1': 'Osaka, Japan (kix1)',
  'lhr1': 'London, UK (lhr1)',
  'pdx1': 'Portland, USA (pdx1)',
  'sfo1': 'San Francisco, USA (sfo1)',
  'sin1': 'Singapore (sin1)',
  'syd1': 'Sydney, Australia (syd1)',
  'global': 'Global Edge Network (Average)'
};

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
    .select('id, name')
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
    .select('service_id, status, response_time, checked_at, meta')
    .in('service_id', serviceIds)
    .gte('checked_at', sevenDaysAgo.toISOString())
    .order('checked_at', { ascending: false })
    .limit(50000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const regionMap: Record<string, any> = {};

  // Initialize Global Average bucket
  regionMap['global'] = {
    id: 'global',
    name: VERCEL_REGIONS['global'],
    hourlyMap: {}
  };

  if (statuses) {
    statuses.forEach(st => {
      // The region the check was performed FROM should be stored in meta.region.
      // If missing, we fallback to a default (or global).
      const meta = st.meta as any;
      const r = (meta && meta.region) ? meta.region : 'global';
      
      if (!regionMap[r] && r !== 'global') {
        regionMap[r] = {
          id: r,
          name: VERCEL_REGIONS[r] || (r.toUpperCase() + ' Region'),
          hourlyMap: {}
        };
      }
      
      const dateObj = new Date(st.checked_at);
      const dayStr = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
      const hour = dateObj.getHours();
      const key = `${dayStr}-${hour}`;
      
      // Update specific region
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
      } else if (st.status === 'degraded') {
        h.degradedCount++;
        if (!h.firstDegradedAt || dateObj < h.firstDegradedAt) h.firstDegradedAt = dateObj;
      }

      // Update Global Average (Aggregates all regions)
      if (!regionMap['global'].hourlyMap[key]) {
        regionMap['global'].hourlyMap[key] = {
          count: 0,
          downCount: 0,
          degradedCount: 0,
          totalLatency: 0,
          firstDegradedAt: null,
          firstDownAt: null
        };
      }
      const g = regionMap['global'].hourlyMap[key];
      g.count++;
      g.totalLatency += st.response_time;
      if (st.status === 'down') {
        g.downCount++;
        if (!g.firstDownAt || dateObj < g.firstDownAt) g.firstDownAt = dateObj;
      } else if (st.status === 'degraded') {
        g.degradedCount++;
        if (!g.firstDegradedAt || dateObj < g.firstDegradedAt) g.firstDegradedAt = dateObj;
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

  // Sort so Global is always first
  resultRegions.sort((a, b) => {
    if (a.id === 'global') return -1;
    if (b.id === 'global') return 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ regions: resultRegions });
}
