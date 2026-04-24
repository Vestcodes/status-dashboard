#!/bin/bash
cat << 'INNER_EOF' >> src/components/UptimeHistoryHeatmap.tsx

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
                  <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px]">
                     <span title="Average" className="text-zinc-400">AVG:</span><span>{hoveredTile.metric.latency}ms</span>
                     <span className="text-zinc-600">·</span>
                     <span title="50th Percentile" className="text-zinc-400">p50:</span><span>{hoveredTile.metric.p50}ms</span>
                     <span className="text-zinc-600">·</span>
                     <span title="95th Percentile" className="text-zinc-400">p95:</span><span>{hoveredTile.metric.p95}ms</span>
                     <span className="text-zinc-600">·</span>
                     <span title="99th Percentile" className="text-zinc-400">p99:</span><span className={hoveredTile.metric.p99 > 1500 ? 'text-red-400' : ''}>{hoveredTile.metric.p99}ms</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 text-xs italic hidden sm:block">Hover over a tile to view exact latency percentiles.</span>
          )}
        </div>
      </div>
    </div>
  );
}
INNER_EOF
