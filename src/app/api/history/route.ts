import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const VERCEL_REGIONS: Record<string, { label: string, zone: string }> = {
  'arn1': { label: 'Stockholm, Sweden (arn1)', zone: 'eu' },
  'bom1': { label: 'Mumbai, India (bom1)', zone: 'ap' },
  'cdg1': { label: 'Paris, France (cdg1)', zone: 'eu' },
  'cle1': { label: 'Cleveland, USA (cle1)', zone: 'na' },
  'cpt1': { label: 'Cape Town, South Africa (cpt1)', zone: 'af' },
  'dub1': { label: 'Dublin, Ireland (dub1)', zone: 'eu' },
  'dxb1': { label: 'Dubai, UAE (dxb1)', zone: 'me' },
  'fra1': { label: 'Frankfurt, Germany (fra1)', zone: 'eu' },
  'gru1': { label: 'São Paulo, Brazil (gru1)', zone: 'sa' },
  'hkg1': { label: 'Hong Kong (hkg1)', zone: 'ap' },
  'hnd1': { label: 'Tokyo, Japan (hnd1)', zone: 'ap' },
  'iad1': { label: 'Washington, D.C., USA (iad1)', zone: 'na' },
  'icn1': { label: 'Seoul, South Korea (icn1)', zone: 'ap' },
  'kix1': { label: 'Osaka, Japan (kix1)', zone: 'ap' },
  'lhr1': { label: 'London, UK (lhr1)', zone: 'eu' },
  'pdx1': { label: 'Portland, USA (pdx1)', zone: 'na' },
  'sfo1': { label: 'San Francisco, USA (sfo1)', zone: 'na' },
  'sin1': { label: 'Singapore (sin1)', zone: 'ap' },
  'syd1': { label: 'Sydney, Australia (syd1)', zone: 'ap' },
  'yul1': { label: 'Montréal, Canada (yul1)', zone: 'na' },
  'global': { label: 'Global Edge Network', zone: 'global' }
};

const ZONES: Record<string, string> = {
  'na': 'North America',
  'eu': 'Europe',
  'ap': 'Asia Pacific',
  'sa': 'South America',
  'af': 'Africa',
  'me': 'Middle East',
  'global': 'Global Edge Network'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .eq('project_id', projectId);

  if (!services || services.length === 0) {
    return NextResponse.json({ zones: [] });
  }

  const serviceIds = services.map(s => s.id);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // FETCH AGGREGATED HOURLY DATA FIRST
  const { data: hourlyStatuses, error: hourlyError } = await supabase
    .from('hourly_statuses')
    .select('*')
    .in('service_id', serviceIds)
    .gte('hour_timestamp', sevenDaysAgo.toISOString());

  // We still fetch the most recent raw statuses (last 2 hours) to fill the gap until the cron rolls them up
  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

  const { data: recentStatuses, error: rawError } = await supabase
    .from('statuses')
    .select('service_id, status, response_time, checked_at, meta')
    .in('service_id', serviceIds)
    .gte('checked_at', twoHoursAgo.toISOString())
    .order('checked_at', { ascending: false });

  if (hourlyError || rawError) {
    return NextResponse.json({ error: (hourlyError || rawError)?.message }, { status: 500 });
  }

  const zoneMap: Record<string, Record<string, any>> = {};

  zoneMap['global'] = {
    'global': { id: 'global', name: 'Global Edge Network (Average)', hourlyMap: {} }
  };

  const expectedRegions = Object.keys(VERCEL_REGIONS).filter(k => k !== 'global');
  expectedRegions.forEach(r => {
    const meta = VERCEL_REGIONS[r];
    if (meta) {
      if (!zoneMap[meta.zone]) zoneMap[meta.zone] = {};
      zoneMap[meta.zone][r] = { id: r, name: meta.label, hourlyMap: {} };
      if (!zoneMap[meta.zone]['aggregate']) {
        zoneMap[meta.zone]['aggregate'] = { id: `zone_${meta.zone}`, name: `${ZONES[meta.zone]} (Average)`, hourlyMap: {} };
      }
    }
  });

  // Function to process a rolled up "bucket"
  const processBucket = (st: any, r: string, dateObj: Date) => {
    const regionMeta = VERCEL_REGIONS[r];
    const zoneId = regionMeta ? regionMeta.zone : 'global';
    
    if (!zoneMap[zoneId]) zoneMap[zoneId] = {};
    if (!zoneMap[zoneId][r] && r !== 'global') {
      zoneMap[zoneId][r] = { id: r, name: regionMeta ? regionMeta.label : (r.toUpperCase() + ' Region'), hourlyMap: {} };
    }
    if (!zoneMap[zoneId]['aggregate'] && r !== 'global') {
      zoneMap[zoneId]['aggregate'] = { id: `zone_${zoneId}`, name: `${ZONES[zoneId] || 'Unknown Zone'} (Average)`, hourlyMap: {} };
    }

    const dayStr = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
    const hour = dateObj.getHours();
    const key = `${dayStr}-${hour}`;
    
      const updateBucket = (bucket: any, isRaw: boolean) => {
      if (!bucket.hourlyMap[key]) {
        bucket.hourlyMap[key] = {
          count: 0, downCount: 0, degradedCount: 0,
          totalLatency: 0, latencies: [], 
          downEvents: [], degradedEvents: []
        };
      }
      const b = bucket.hourlyMap[key];
      
      if (isRaw) {
        b.count++;
        b.totalLatency += st.response_time;
        if (st.response_time > 0) b.latencies.push(st.response_time);
        if (st.status === 'down') {
          b.downCount++;
          b.downEvents.push(st.checked_at);
        } else if (st.status === 'degraded') {
          b.degradedCount++;
          b.degradedEvents.push(st.checked_at);
        }
      } else {
        b.count += st.total_pings;
        b.downCount += st.down_pings;
        b.degradedCount += st.degraded_pings;
        b.totalLatency += st.total_response_time;
        if (st.avg_response_time > 0) {
          for(let i=0; i<st.total_pings; i++) b.latencies.push(st.avg_response_time);
        }
        if (st.down_events && Array.isArray(st.down_events)) {
           b.downEvents.push(...st.down_events);
        }
        if (st.degraded_events && Array.isArray(st.degraded_events)) {
           b.degradedEvents.push(...st.degraded_events);
        }
      }
    };

    if (r !== 'global') {
      const isRaw = !st.hasOwnProperty('total_pings');
      updateBucket(zoneMap[zoneId][r], isRaw);
      updateBucket(zoneMap[zoneId]['aggregate'], isRaw);
    }
    updateBucket(zoneMap['global']['global'], !st.hasOwnProperty('total_pings'));
  };

  // 1. Process Pre-Calculated Hourly Statuses
  if (hourlyStatuses && hourlyStatuses.length > 0) {
    hourlyStatuses.forEach(st => {
      const r = st.region || 'iad1';
      const dateObj = new Date(st.hour_timestamp);
      processBucket(st, r, dateObj);
    });
  }

  // 2. Process Raw Statuses (Recent 2 Hours)
  if (recentStatuses && recentStatuses.length > 0) {
    recentStatuses.forEach(st => {
      const metaObj = st.meta as any;
      const r = (metaObj && metaObj.region) ? metaObj.region : 'iad1';
      const dateObj = new Date(st.checked_at);
      processBucket(st, r, dateObj);
    });
  }

  const calculatePercentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  };

  const buildDailyData = (hMap: any) => {
    const dailyData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
      
      const hours = [];
      for (let h = 0; h < 24; h++) {
        const key = `${dayStr}-${h}`;
        const agg = hMap[key];
        
        if (!agg || agg.count === 0) {
          hours.push({ hour: h, uptime: 100, status: "operational", latency: 0, p50: 0, p90: 0, p95: 0, p99: 0, incidentCount: 0, noData: true });
        } else {
          let status = "operational";
          let eventTimes: string[] = [];
          
          if (agg.downCount > 0) {
            // Wait, for aggregate global zones, 1 failure out of 100 shouldn't trigger "DOWN".
            // Let's set a 10% threshold for "DOWN" and a 2% threshold for "DEGRADED" on aggregate zones.
            // But for specific regions, any failure is a failure.
            
            // We can calculate the failure rate.
            const failRate = agg.downCount / agg.count;
            if (failRate > 0.05) {
                status = "down";
            } else {
                status = "degraded"; // It's just a blip, not completely down
            }
            eventTimes = agg.downEvents || [];
          } else if (agg.degradedCount > 0) {
            status = "degraded";
            eventTimes = agg.degradedEvents || [];
          }
          
          let uptime = 100;
          if (agg.downCount > 0) uptime = Math.max(0, 100 - ((agg.downCount / agg.count) * 100));
          else if (agg.degradedCount > 0) uptime = Math.max(0, 100 - ((agg.degradedCount / agg.count) * 10));

          // Sort and deduplicate events
          eventTimes = [...new Set(eventTimes)].sort();

          hours.push({
            hour: h,
            uptime,
            status,
            latency: Math.round(agg.totalLatency / agg.count),
            p50: calculatePercentile(agg.latencies, 50),
            p90: calculatePercentile(agg.latencies, 90),
            p95: calculatePercentile(agg.latencies, 95),
            p99: calculatePercentile(agg.latencies, 99),
            incidentCount: agg.downCount,
            eventTimes
          });
        }
      }
      dailyData.push({ date, dateStr: dayStr, hours });
    }
    return dailyData;
  };

  const formattedZones = Object.keys(zoneMap).map(zoneKey => {
    const regionsInZone = Object.keys(zoneMap[zoneKey]).map(rKey => {
      const data = buildDailyData(zoneMap[zoneKey][rKey].hourlyMap);
      
      return {
        id: zoneMap[zoneKey][rKey].id,
        name: zoneMap[zoneKey][rKey].name,
        data: data,
        isAggregate: rKey === 'aggregate' || rKey === 'global'
      };
    });

    regionsInZone.sort((a, b) => {
      if (a.isAggregate) return -1;
      if (b.isAggregate) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      id: zoneKey,
      name: ZONES[zoneKey] || 'Other',
      regions: regionsInZone
    };
  });

  const zoneOrder = ['global', 'na', 'eu', 'ap', 'sa', 'af', 'me'];
  formattedZones.sort((a, b) => {
    let aIdx = zoneOrder.indexOf(a.id);
    let bIdx = zoneOrder.indexOf(b.id);
    if (aIdx === -1) aIdx = 99;
    if (bIdx === -1) bIdx = 99;
    return aIdx - bIdx;
  });

  return NextResponse.json({ zones: formattedZones });
}
