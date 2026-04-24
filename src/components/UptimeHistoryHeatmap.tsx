"use client";

import React, { useState, useMemo } from "react";

// Mock data types for the heatmap
interface HourlyMetric {
  hour: number;
  uptime: number; // percentage (0-100)
  status: "operational" | "degraded" | "down" | "maintenance";
  latency: number; // ms
  incidentCount: number;
}

interface DailyMetric {
  date: Date;
  dateStr: string; // DD.MM.YYYY
  hours: HourlyMetric[];
}

interface RegionData {
  id: string;
  name: string;
  data: DailyMetric[];
}

// Helper to generate mock data for the last 90 days
const generateMockData = (): DailyMetric[] => {
  const data: DailyMetric[] = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    
    const hours: HourlyMetric[] = [];
    for (let h = 0; h < 24; h++) {
      // Randomly introduce some degraded/down states
      const rand = Math.random();
      let status: HourlyMetric["status"] = "operational";
      let uptime = 100;
      let latency = 45 + Math.random() * 20;
      let incidentCount = 0;

      if (rand > 0.98) {
        status = "down";
        uptime = 0;
        latency = 0;
        incidentCount = 1;
      } else if (rand > 0.95) {
        status = "degraded";
        uptime = 95 + Math.random() * 4;
        latency = 200 + Math.random() * 500;
      }

      hours.push({
        hour: h,
        uptime,
        status,
        latency: Math.round(latency),
        incidentCount
      });
    }

    data.push({
      date,
      dateStr: dayStr,
      hours
    });
  }
  
  return data;
};

const REGIONS: RegionData[] = [
  { id: "global", name: "Global Edge Network", data: generateMockData() },
  { id: "us-east", name: "US East (N. Virginia)", data: generateMockData() },
  { id: "eu-central", name: "EU Central (Frankfurt)", data: generateMockData() },
  { id: "ap-south", name: "AP South (Mumbai)", data: generateMockData() },
];

const getStatusColor = (status: HourlyMetric["status"]) => {
  switch (status) {
    case "operational": return "bg-green-500";
    case "degraded": return "bg-yellow-500";
    case "down": return "bg-red-500";
    case "maintenance": return "bg-blue-500";
    default: return "bg-gray-200 dark:bg-gray-800";
  }
};

export function UptimeHistoryHeatmap() {
  const [selectedRegionId, setSelectedRegionId] = useState<string>("global");
  const [hoveredTile, setHoveredTile] = useState<{ date: string; metric: HourlyMetric } | null>(null);

  const selectedRegion = useMemo(() => 
    REGIONS.find(r => r.id === selectedRegionId) || REGIONS[0]
  , [selectedRegionId]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">90-Day Uptime History</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Hourly granularity across regions</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select 
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value)}
            className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
          >
            {REGIONS.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          {/* Header row (Hours) */}
          <div className="flex mb-2 ml-24">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-xs text-center text-zinc-400 select-none">
                {i.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Data rows */}
          <div className="flex flex-col gap-1.5">
            {selectedRegion.data.map((day) => (
              <div key={day.dateStr} className="flex items-center group relative">
                <div className="w-24 text-xs font-medium text-zinc-500 dark:text-zinc-400 select-none shrink-0">
                  {day.dateStr}
                </div>
                
                <div className="flex flex-1 gap-1 relative">
                  {day.hours.map((hour) => (
                    <div 
                      key={`${day.dateStr}-${hour.hour}`}
                      className={`flex-1 h-5 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 ${getStatusColor(hour.status)} opacity-80 hover:opacity-100`}
                      onMouseEnter={() => setHoveredTile({ date: day.dateStr, metric: hour })}
                      onMouseLeave={() => setHoveredTile(null)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Tooltip Overlay Area */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 gap-4">
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500 opacity-80" /> Operational</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-500 opacity-80" /> Degraded</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500 opacity-80" /> Down</div>
        </div>

        {/* Dynamic info based on hover */}
        <div className="h-8 flex items-center justify-end text-sm">
          {hoveredTile ? (
            <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              <span className="font-medium">{hoveredTile.date}</span>
              <span className="text-zinc-400">|</span>
              <span>{hoveredTile.metric.hour.toString().padStart(2, '0')}:00 - {(hoveredTile.metric.hour + 1).toString().padStart(2, '0')}:00</span>
              <span className="text-zinc-400">|</span>
              <span className={`font-semibold ${hoveredTile.metric.status === 'operational' ? 'text-green-500' : hoveredTile.metric.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>
                {hoveredTile.metric.uptime.toFixed(2)}%
              </span>
              <span className="text-zinc-400">|</span>
              <span>{hoveredTile.metric.latency}ms</span>
            </div>
          ) : (
            <span className="text-zinc-400 text-xs italic">Hover over a tile to view specific hour metrics.</span>
          )}
        </div>
      </div>
    </div>
  );
}
