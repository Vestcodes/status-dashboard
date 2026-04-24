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

  const { data: statuses, error } = await supabase
    .from('statuses')
    .select('service_id, status, response_time, checked_at, meta')
    .in('service_id', serviceIds)
    .gte('checked_at', sevenDaysAgo.toISOString())
    .order('checked_at', { ascending: false })
    .limit(100000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const zoneMap: Record<string, Record<string, any>> = {};

  zoneMap['global'] = {
    'global': {
      id: 'global',
      name: 'Global Edge Network (Average)',
      hourlyMap: {}
    }
  };

  const expectedRegions = Object.keys(VERCEL_REGIONS).filter(k => k !== 'global');
  expectedRegions.forEach(r => {
    const meta = VERCEL_REGIONS[r];
    if (meta) {
      if (!zoneMap[meta.zone]) zoneMap[meta.zone] = {};
      zoneMap[meta.zone][r] = {
        id: r,
        name: meta.label,
        hourlyMap: {}
      };
      if (!zoneMap[meta.zone]['aggregate']) {
        zoneMap[meta.zone]['aggregate'] = {
          id: `zone_${meta.zone}`,
          name: `${ZONES[meta.zone]} (Average)`,
          hourlyMap: {}
        };
      }
    }
  });

  if (statuses) {
    statuses.forEach(st => {
      const metaObj = st.meta as any;
      const r = (metaObj && metaObj.region) ? metaObj.region : 'global';
      
      const regionMeta = VERCEL_REGIONS[r];
      const zoneId = regionMeta ? regionMeta.zone : 'global';
      
      if (!zoneMap[zoneId]) zoneMap[zoneId] = {};
      
      if (!zoneMap[zoneId][r] && r !== 'global') {
        zoneMap[zoneId][r] = {
          id: r,
          name: regionMeta ? regionMeta.label : (r.toUpperCase() + ' Region'),
          hourlyMap: {}
        };
      }
      
      if (!zoneMap[zoneId]['aggregate'] && r !== 'global') {
        zoneMap[zoneId]['aggregate'] = {
          id: `zone_${zoneId}`,
          name: `${ZONES[zoneId] || 'Unknown Zone'} (Average)`,
          hourlyMap: {}
        };
      }

      const dateObj = new Date(st.checked_at);
      const dayStr = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;
      const hour = dateObj.getHours();
      const key = `${dayStr}-${hour}`;
      
      const updateBucket = (bucket: any) => {
        if (!bucket.hourlyMap[key]) {
          bucket.hourlyMap[key] = {
            count: 0, downCount: 0, degradedCount: 0,
            totalLatency: 0, 
            latencies: [], // Array to compute p50/p95/etc later
            firstDegradedAt: null, firstDownAt: null
          };
        }
        const b = bucket.hourlyMap[key];
        b.count++;
        b.totalLatency += st.response_time;
        if (st.response_time > 0) b.latencies.push(st.response_time);

        if (st.status === 'down') {
          b.downCount++;
          if (!b.firstDownAt || dateObj < b.firstDownAt) b.firstDownAt = dateObj;
        } else if (st.status === 'degraded') {
          b.degradedCount++;
          if (!b.firstDegradedAt || dateObj < b.firstDegradedAt) b.firstDegradedAt = dateObj;
        }
      };

      if (r !== 'global') updateBucket(zoneMap[zoneId][r]);
      if (r !== 'global') updateBucket(zoneMap[zoneId]['aggregate']);
      updateBucket(zoneMap['global']['global']);
    });
  }

  // Calculate percentiles helper
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
        
        if (!agg) {
          hours.push({ hour: h, uptime: 100, status: "operational", latency: 0, p50: 0, p90: 0, p95: 0, p99: 0, incidentCount: 0, noData: true });
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
          if (agg.downCount > 0) uptime = Math.max(0, 100 - ((agg.downCount / agg.count) * 100));
          else if (agg.degradedCount > 0) uptime = Math.max(0, 100 - ((agg.degradedCount / agg.count) * 10));

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
            eventTime
          });
        }
      }
      dailyData.push({ date, dateStr, hours });
    }
    return dailyData;
  };

  const formattedZones = Object.keys(zoneMap).map(zoneKey => {
    const regionsInZone = Object.keys(zoneMap[zoneKey]).map(rKey => {
      return {
        id: zoneMap[zoneKey][rKey].id,
        name: zoneMap[zoneKey][rKey].name,
        data: buildDailyData(zoneMap[zoneKey][rKey].hourlyMap),
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
