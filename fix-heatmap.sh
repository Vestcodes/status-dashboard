#!/bin/bash
cat << 'INNER_EOF' > src/components/UptimeHistoryHeatmap.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";

interface HourlyMetric {
  hour: number;
  uptime: number;
  status: "operational" | "degraded" | "down" | "maintenance";
  latency: number;
  incidentCount: number;
  noData?: boolean;
  eventTime?: string;
}

interface DailyMetric {
  date: Date | string;
  dateStr: string;
  hours: HourlyMetric[];
}

interface RegionData {
  id: string;
  name: string;
  isAggregate: boolean;
  data: DailyMetric[];
}

interface ZoneData {
  id: string;
  name: string;
  regions: RegionData[];
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
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  
  const [hoveredTile, setHoveredTile] = useState<{ date: string; metric: HourlyMetric } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/history?projectId=${projectId}`);
        const json = await res.json();
        
        if (json.zones && json.zones.length > 0) {
          setZones(json.zones);
          setSelectedZoneId(json.zones[0].id);
          setSelectedRegionId(json.zones[0].regions[0].id);
        } else {
          setZones([]);
        }
      } catch (err) {
        console.error("Failed to fetch uptime history:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId) fetchHistory();
  }, [projectId]);

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZoneId = e.target.value;
    setSelectedZoneId(newZoneId);
    const targetZone = zones.find(z => z.id === newZoneId);
    if (targetZone && targetZone.regions.length > 0) {
      setSelectedRegionId(targetZone.regions[0].id);
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegionId(e.target.value);
  };

  const selectedZone = useMemo(() => zones.find(z => z.id === selectedZoneId), [selectedZoneId, zones]);
  const selectedRegion = useMemo(() => selectedZone?.regions.find(r => r.id === selectedRegionId), [selectedZone, selectedRegionId]);

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 flex justify-center items-center h-48 sm:h-64 shadow-sm animate-pulse">
        <span className="text-zinc-500 text-sm">Loading telemetry...</span>
      </div>
    );
  }

  if (!zones || zones.length === 0 || !selectedRegion) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Edge Telemetry & Uptime</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Not enough data to render the history.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 sm:mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edge Telemetry</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">7-Day hourly granularity across Global Zones</p>
        </div>
        
        {zones.length > 1 && (
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select 
              value={selectedZoneId}
              onChange={handleZoneChange}
              className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
            >
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>

            {selectedZone && selectedZone.regions.length > 1 && (
              <select 
                value={selectedRegionId}
                onChange={handleRegionChange}
                className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                {selectedZone.regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[600px] md:min-w-[800px]">
          <div className="flex mb-2 ml-16 sm:ml-24">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-[10px] sm:text-xs text-center text-zinc-400 select-none">
                {i.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2">
            {selectedRegion.data.map((day) => (
              <div key={day.dateStr} className="flex items-center group relative">
                <div className="w-16 sm:w-24 text-[9px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none shrink-0">
                  {day.dateStr}
                </div>
                
                <div className="flex flex-1 gap-[2px] sm:gap-1 relative">
                  {day.hours.map((hour) => (
                    <div 
                      key={`${day.dateStr}-${hour.hour}`}
                      className={`flex-1 h-6 sm:h-8 rounded-sm cursor-pointer transition-all duration-200 hover:scale-[1.15] hover:z-10 ${getStatusColor(hour.status, hour.noData)} ${!hour.noData ? 'opacity-80 hover:opacity-100' : ''}`}
                      onMouseEnter={() => setHoveredTile({ date: day.dateStr, metric: hour })}
                      onMouseLeave={() => setHoveredTile(null)}
                      onClick={() => setHoveredTile({ date: day.dateStr, metric: hour })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col xl:flex-row justify-between items-start xl:items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-green-500 opacity-80" /> Operational</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-yellow-500 opacity-80" /> Degraded</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-red-500 opacity-80" /> Down</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-gray-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800" /> No Data</div>
        </div>

        <div className="w-full xl:w-auto flex items-center justify-start xl:justify-end text-sm min-h-[40px]">
          {hoveredTile ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all w-full sm:w-auto">
              <span className="font-medium text-[10px] sm:text-xs shrink-0">{hoveredTile.date}</span>
              <span className="text-zinc-400 hidden sm:inline">|</span>
              <span className="font-mono text-[10px] sm:text-xs shrink-0">{hoveredTile.metric.hour.toString().padStart(2, '0')}:00 - {(hoveredTile.metric.hour + 1).toString().padStart(2, '0')}:00</span>
              <span className="text-zinc-400 hidden sm:inline">|</span>
              {hoveredTile.metric.noData ? (
                <span className="text-zinc-400 italic text-[10px] sm:text-xs w-full sm:w-auto mt-1 sm:mt-0 block sm:inline">No metrics collected</span>
              ) : (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                  <span className={`font-semibold text-[10px] sm:text-xs ${hoveredTile.metric.status === 'operational' ? 'text-green-500' : hoveredTile.metric.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {hoveredTile.metric.status.toUpperCase()}
                  </span>
                  
                  {(hoveredTile.metric.status === 'degraded' || hoveredTile.metric.status === 'down') && hoveredTile.metric.eventTime && (
                    <>
                      <span className="text-zinc-400 hidden sm:inline">|</span>
                      <span className="text-[10px] sm:text-xs text-zinc-500 shrink-0">
                        Triggered at: {new Date(hoveredTile.metric.eventTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </>
                  )}
                  
                  <span className="text-zinc-400 hidden sm:inline">|</span>
                  <span className="font-mono text-[10px] sm:text-xs shrink-0">{hoveredTile.metric.latency}ms avg</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 text-xs italic hidden sm:block">Hover over a tile to view specific hour metrics.</span>
          )}
        </div>
      </div>
    </div>
  );
}
INNER_EOF
