"use client";

import React, { useState, useEffect, useMemo } from "react";

interface HourlyMetric {
  hour: number;
  uptime: number; // percentage (0-100)
  status: "operational" | "degraded" | "down" | "maintenance";
  latency: number; // ms
  incidentCount: number;
  noData?: boolean;
  eventTime?: string;
}

interface DailyMetric {
  date: Date | string;
  dateStr: string; // DD.MM.YYYY
  hours: HourlyMetric[];
}

interface RegionData {
  id: string;
  name: string;
  data: DailyMetric[];
}

const getStatusColor = (status: HourlyMetric["status"], noData?: boolean) => {
  if (noData) return "bg-gray-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800";
  switch (status) {
    case "operational": return "bg-green-500";
    case "degraded": return "bg-yellow-500";
    case "down": return "bg-red-500";
    case "maintenance": return "bg-blue-500";
    default: return "bg-gray-200 dark:bg-gray-800";
  }
};

export function UptimeHistoryHeatmap({ projectId, services }: { projectId: string, services: any[] }) {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [hoveredTile, setHoveredTile] = useState<{ date: string; metric: HourlyMetric } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/history?projectId=${projectId}`);
        const json = await res.json();
        
        if (json.regions && json.regions.length > 0) {
          setRegions(json.regions);
          setSelectedRegionId(json.regions[0].id);
        } else {
          setRegions([]);
        }
      } catch (err) {
        console.error("Failed to fetch uptime history:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId) {
      fetchHistory();
    }
  }, [projectId]);

  const selectedRegion = useMemo(() => 
    regions.find(r => r.id === selectedRegionId) || regions[0]
  , [selectedRegionId, regions]);

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex justify-center items-center h-64 shadow-sm animate-pulse">
        <span className="text-zinc-500 text-sm">Loading 7-day history...</span>
      </div>
    );
  }

  if (!regions || regions.length === 0 || !selectedRegion) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7-Day Uptime History</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Not enough data to render the history.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">7-Day Uptime History</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Hourly granularity across regions</p>
        </div>
        
        {regions.length > 1 && (
          <div className="mt-4 sm:mt-0">
            <select 
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
        )}
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
          <div className="flex flex-col gap-2">
            {selectedRegion.data.map((day) => (
              <div key={day.dateStr} className="flex items-center group relative">
                <div className="w-24 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none shrink-0">
                  {day.dateStr}
                </div>
                
                <div className="flex flex-1 gap-1 relative">
                  {day.hours.map((hour) => (
                    <div 
                      key={`${day.dateStr}-${hour.hour}`}
                      className={`flex-1 h-8 rounded-sm cursor-pointer transition-all duration-200 hover:scale-[1.15] hover:z-10 ${getStatusColor(hour.status, hour.noData)} ${!hour.noData ? 'opacity-80 hover:opacity-100' : ''}`}
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
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 gap-4">
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500 opacity-80" /> Operational</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-500 opacity-80" /> Degraded</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500 opacity-80" /> Down</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800" /> No Data</div>
        </div>

        {/* Dynamic info based on hover */}
        <div className="h-10 flex items-center justify-end text-sm">
          {hoveredTile ? (
            <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all">
              <span className="font-medium text-xs">{hoveredTile.date}</span>
              <span className="text-zinc-400">|</span>
              <span className="font-mono text-xs">{hoveredTile.metric.hour.toString().padStart(2, '0')}:00 - {(hoveredTile.metric.hour + 1).toString().padStart(2, '0')}:00</span>
              <span className="text-zinc-400">|</span>
              {hoveredTile.metric.noData ? (
                <span className="text-zinc-400 italic text-xs">No metrics collected</span>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-xs ${hoveredTile.metric.status === 'operational' ? 'text-green-500' : hoveredTile.metric.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {hoveredTile.metric.status.toUpperCase()}
                  </span>
                  
                  {(hoveredTile.metric.status === 'degraded' || hoveredTile.metric.status === 'down') && hoveredTile.metric.eventTime && (
                    <>
                      <span className="text-zinc-400">|</span>
                      <span className="text-xs text-zinc-500">
                        Triggered at: {new Date(hoveredTile.metric.eventTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </>
                  )}
                  
                  <span className="text-zinc-400">|</span>
                  <span className="font-mono text-xs">{hoveredTile.metric.latency}ms avg</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 text-xs italic">Hover over a tile to view specific hour metrics.</span>
          )}
        </div>
      </div>
    </div>
  );
}
