#!/bin/bash
cat << 'INNER_EOF' >> src/components/UptimeHistoryHeatmap.tsx

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
INNER_EOF
