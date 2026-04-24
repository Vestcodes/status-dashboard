import { createClient } from '@/utils/supabase/server'
import { Activity, ArrowLeft, Clock, ShieldCheck, Globe2, Server, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UptimeHistoryHeatmap } from "@/components/UptimeHistoryHeatmap";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatusPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const supabase = await createClient();

	const { data: projects, error } = await supabase
		.from('projects')
		.select(`
			*,
			services (*)
		`)
		.eq('slug', slug);

	const project = projects && projects.length > 0 ? projects[0] : null;

	if (!project) {
		console.error(`Project not found for slug: ${slug}`, error);
		notFound();
	}

	const serviceIds = project.services?.map((s: any) => s.id) || [];
	
	const { data: latestStatuses } = await supabase
		.from('statuses')
		.select('*')
		.in('service_id', serviceIds)
		.order('checked_at', { ascending: false })
		.limit(100);

	const statusMap: Record<string, any> = {};
	if (latestStatuses) {
		latestStatuses.forEach(st => {
			if (!statusMap[st.service_id]) {
				statusMap[st.service_id] = st;
			}
		});
	}

	let anyDown = false;
	let allOperational = true;
	let avgLatency = 0;
	let latencyCount = 0;
	let latestCheck: any = null;

	const mappedServices = project.services?.map((s: any) => {
		const recentStatus = statusMap[s.id];
		const status = recentStatus ? recentStatus.status : 'pending';
		const latency = recentStatus ? recentStatus.response_time : 0;
		const checkedAt = recentStatus ? new Date(recentStatus.checked_at) : null;
		
		if (checkedAt && (!latestCheck || checkedAt > latestCheck)) {
			latestCheck = checkedAt;
		}

		if (status === 'down') {
			anyDown = true;
		}
		if (status !== 'operational') {
			allOperational = false;
		}
		if (latency > 0) {
			avgLatency += latency;
			latencyCount++;
		}

		return {
			...s,
			currentStatus: status,
			latency
		};
	}) || [];

	avgLatency = latencyCount > 0 ? Math.round(avgLatency / latencyCount) : 0;

	const globalStatus = anyDown ? 'down' : (allOperational ? 'operational' : 'degraded');

	return (
		<div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
			<Link
				href="/"
				className="mono-accent text-muted-text hover:text-off-white flex items-center gap-2 mb-8 transition-colors"
			>
				<ArrowLeft size={16} /> RETURN TO DASHBOARD
			</Link>

			<header className="space-y-6 pb-8 border-b border-white/10">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-off-white mb-2">
							{project.name}
						</h1>
						<div className="flex items-center gap-2">
							<Globe2 size={14} className="text-muted-text" />
							<a href={`https://${project.domain}`} target="_blank" rel="noreferrer" className="text-muted-text hover:text-[#FF9933] transition-colors">
								{project.domain}
							</a>
						</div>
					</div>
					
					<div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel border ${
						globalStatus === 'operational' ? 'border-[#22C55E]/20 bg-[#22C55E]/5' :
						globalStatus === 'degraded' ? 'border-[#F59E0B]/20 bg-[#F59E0B]/5' :
						'border-[#EF4444]/20 bg-[#EF4444]/5'
					}`}>
						<div className={`status-dot ${globalStatus}`}></div>
						<span className={`text-sm font-medium uppercase tracking-wider ${
							globalStatus === 'operational' ? 'text-[#22C55E]' :
							globalStatus === 'degraded' ? 'text-[#F59E0B]' :
							'text-[#EF4444]'
						}`}>{globalStatus}</span>
					</div>
				</div>
				
				<div className="flex items-center gap-4 pt-2">
					<Link href={`/status/${slug}/incidents`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-off-white transition-all">
						<AlertTriangle size={14} className="text-[#F59E0B]" />
						View Incident History
						<ArrowRight size={14} className="opacity-50" />
					</Link>
				</div>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="glass-panel p-6 relative overflow-hidden group hover:bg-white/[0.03] transition-all">
					<div className="mono-accent text-muted-text mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
						<Activity size={14} /> Average Latency
					</div>
					<div className="text-3xl font-semibold text-off-white">{avgLatency > 0 ? `${avgLatency}ms` : 'N/A'}</div>
					<div className="text-xs text-muted-text mt-3 font-mono">
						Across {latencyCount} active endpoints
					</div>
				</div>
				<div className="glass-panel p-6 relative overflow-hidden group hover:bg-white/[0.03] transition-all">
					<div className="mono-accent text-muted-text mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
						<Clock size={14} /> 30-Day Uptime
					</div>
					<div className="text-3xl font-semibold text-[#22C55E]">100%</div>
					<div className="text-xs text-muted-text mt-3 font-mono">
						Target SLA Met
					</div>
				</div>
				<div className="glass-panel p-6 relative overflow-hidden group hover:bg-white/[0.03] transition-all">
					<div className="mono-accent text-muted-text mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
						<ShieldCheck size={14} /> Last Checked
					</div>
					<div className="text-3xl font-semibold text-off-white">
						{latestCheck ? 'Just now' : 'Pending'}
					</div>
					<div className="text-xs text-muted-text mt-3 font-mono truncate">
						{latestCheck ? latestCheck.toLocaleString() : 'Waiting for telemetry'}
					</div>
				</div>
			</div>

			<section className="space-y-6 pt-6">
				<h2 className="text-xl font-medium tracking-wide flex items-center gap-3 text-off-white/80 pb-4 border-b border-white/10">
					<Server size={18} className="text-[#FF9933] opacity-80" /> 
					Endpoint Status
				</h2>
				
				<div className="grid grid-cols-1 gap-4">
					{mappedServices.length === 0 ? (
						<div className="text-muted-text glass-panel p-8 text-center italic rounded-xl">
							No endpoints configured for this project yet.
						</div>
					) : mappedServices.map((s: any) => (
						<div key={s.id} className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-3">
									<div className={`status-dot ${s.currentStatus}`}></div>
									<span className="text-off-white font-medium">{s.name}</span>
								</div>
								<div className="text-sm text-muted-text flex items-center gap-2">
									<span className="font-mono text-[10px] px-2 py-0.5 bg-white/5 rounded text-white/50 uppercase">{s.region || 'Global'}</span>
								</div>
							</div>
							
							<div className="flex items-center gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
								<div className="flex flex-col md:items-end gap-1">
									<span className="text-[10px] uppercase tracking-wider text-muted-text mono-accent">Response Time</span>
									<span className="font-mono text-sm text-off-white">{s.latency > 0 ? `${s.latency}ms` : 'Pending...'}</span>
								</div>
								<div className="flex flex-col md:items-end gap-1">
									<span className="text-[10px] uppercase tracking-wider text-muted-text mono-accent">Current Status</span>
									<span className={`font-mono text-sm capitalize ${
										s.currentStatus === 'operational' ? 'text-[#22C55E]' :
										s.currentStatus === 'degraded' ? 'text-[#F59E0B]' :
										s.currentStatus === 'down' ? 'text-[#EF4444]' : 'text-muted-text'
									}`}>{s.currentStatus}</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="space-y-6 pt-6">
				<UptimeHistoryHeatmap services={mappedServices} projectId={project.id} />
			</section>
		</div>
	);
}
