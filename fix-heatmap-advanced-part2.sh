#!/bin/bash
cat << 'INNER_EOF' >> src/components/UptimeHistoryHeatmap.tsx

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
        <span className="text-zinc-500 text-sm">Loading advanced telemetry...</span>
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
INNER_EOF
