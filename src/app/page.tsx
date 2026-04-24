import { createClient } from '@/utils/supabase/server'
import { Activity, AlertTriangle, CheckCircle2, Clock, Server, Globe2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
	const supabase = await createClient()

	const { data: projectsData } = await supabase
		.from('projects')
		.select(`
			*,
			services (*)
		`)
		.eq('is_public', true)
		.order('created_at', { ascending: true })

	const serviceIds = projectsData?.flatMap(p => p.services?.map((s:any) => s.id) || []) || [];

	const { data: latestStatuses } = await supabase
		.from('statuses')
		.select('*')
		.in('service_id', serviceIds)
		.order('checked_at', { ascending: false })
		.limit(500);

	const statusMap: Record<string, any> = {};
	if (latestStatuses) {
		latestStatuses.forEach(st => {
			if (!statusMap[st.service_id]) {
				statusMap[st.service_id] = st;
			}
		});
	}

	let globalStatus = 'operational';
	let downCount = 0;

	const projects = projectsData?.map(p => {
		let allOperational = true;
		let anyDown = false;
		
		const mappedServices = p.services?.map((s: any) => {
			const recentStatus = statusMap[s.id];
			const status = recentStatus ? recentStatus.status : 'pending';
			const latency = recentStatus ? `${recentStatus.response_time}ms` : 'Pending...';
			
			if (status === 'down') {
				anyDown = true;
				downCount++;
			}
			if (status !== 'operational') allOperational = false;

			return {
				id: s.id,
				name: s.name,
				region: s.region,
				latency: latency,
				status: status
			};
		}) || [];

		const projectStatus = anyDown ? 'down' : (allOperational ? 'operational' : 'degraded');
		if (projectStatus === 'down') globalStatus = 'down';
		else if (projectStatus === 'degraded' && globalStatus !== 'down') globalStatus = 'degraded';

		return {
			id: p.id,
			name: p.name,
			slug: p.slug,
			domain: p.domain,
			uptime: "100%", // Mock for now
			status: projectStatus,
			services: mappedServices
		};
	}) || []

	const statusText = globalStatus === 'operational' ? 'All Systems Operational' 
		: globalStatus === 'degraded' ? 'Partial System Outage' 
		: 'Major System Outage';

	return (
		<div className="space-y-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
			<header className="space-y-4 pt-4">
				<div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel border mb-4 ${
					globalStatus === 'operational' ? 'border-[#22C55E]/20 bg-[#22C55E]/5' :
					globalStatus === 'degraded' ? 'border-[#F59E0B]/20 bg-[#F59E0B]/5' :
					'border-[#EF4444]/20 bg-[#EF4444]/5'
				}`}>
					<div className={`status-dot ${globalStatus}`}></div>
					<span className={`text-sm font-medium ${
						globalStatus === 'operational' ? 'text-[#22C55E]' :
						globalStatus === 'degraded' ? 'text-[#F59E0B]' :
						'text-[#EF4444]'
					}`}>{statusText}</span>
				</div>
				<h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-off-white/90">
					Central Control Plane
				</h1>
				<p className="font-mono text-muted-text text-[0.95rem] max-w-2xl leading-relaxed">
					Real-time infrastructure health, latency tracking, and incident overrides. Region-aware execution across Vestcodes deployments.
				</p>
			</header>

			<section className="space-y-6">
				<div className="flex items-center justify-between pb-4 border-b border-white/10">
					<h2 className="text-xl font-medium tracking-wide flex items-center gap-3 text-off-white/80">
						<Server size={18} className="text-[#FF9933] opacity-80" /> 
						Active Projects
					</h2>
					<Link href="/login" className="text-xs mono-accent px-3 py-1.5 glass-panel hover:bg-white/5 transition-colors">
						Sysadmin Login
					</Link>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{projects.map((p) => (
						<Link href={`/status/${p.slug}`} key={p.slug} className={`glass-panel p-6 flex flex-col group relative overflow-hidden transition-all hover:border-white/30 hover:bg-white/[0.04] ${p.status === 'down' ? 'border-[#EF4444]/30' : ''} cursor-pointer`}>
							<div className={`absolute -top-24 -right-24 w-48 h-48 opacity-5 rounded-full blur-3xl group-hover:opacity-15 transition-opacity duration-500 ${
								p.status === 'operational' ? 'bg-[#22C55E]' :
								p.status === 'degraded' ? 'bg-[#F59E0B]' :
								'bg-[#EF4444]'
							}`}></div>
							
							<div className="flex justify-between items-start mb-6 z-10">
								<div>
									<h3 className="text-xl font-medium text-off-white/90 mb-1 group-hover:text-white transition-colors">{p.name}</h3>
									<div className="flex items-center gap-2">
										<Globe2 size={12} className="text-muted-text" />
										<span className="mono-accent text-muted-text text-[11px] group-hover:text-[#FF9933] transition-colors">
											{p.domain}
										</span>
									</div>
								</div>
								<div className={`status-dot ${p.status} mt-2`}></div>
							</div>

							<div className="space-y-3 z-10 flex-1">
								{p.services.length === 0 ? (
									<span className="text-xs text-muted-text italic">No services configured yet.</span>
								) : p.services.slice(0, 3).map((s: any) => (
									<div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
										<div className="flex items-center gap-3">
											<div className={`w-1.5 h-1.5 rounded-full ${s.status === 'operational' ? 'bg-[#22C55E]' : s.status === 'degraded' ? 'bg-[#F59E0B]' : s.status === 'down' ? 'bg-[#EF4444]' : 'bg-gray-500'}`}></div>
											<span className="text-sm text-off-white/80">{s.name}</span>
										</div>
										<span className="font-mono text-xs text-muted-text">{s.latency}</span>
									</div>
								))}
								{p.services.length > 3 && (
									<div className="text-xs text-muted-text text-center pt-2 mono-accent">
										+{p.services.length - 3} more endpoints
									</div>
								)}
							</div>

							<div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center z-10">
								<div className="flex items-center gap-2">
									<span className="font-mono text-xs text-muted-text">UPTIME 30D</span>
									<span className="font-mono text-sm text-[#22C55E]">{p.uptime}</span>
								</div>
								<div className="flex items-center gap-1.5 text-xs mono-accent text-muted-text group-hover:text-off-white transition-colors">
									Details <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
								</div>
							</div>
						</Link>
					))}
					
					{projects.length === 0 && (
						<div className="col-span-full py-12 text-center text-muted-text border border-white/5 rounded-xl border-dashed">
							No projects currently being monitored.
						</div>
					)}
				</div>
			</section>

			<section className="space-y-6 pt-8">
				<div className="flex items-center justify-between pb-4 border-b border-white/10">
					<h2 className="text-xl font-medium tracking-wide flex items-center gap-3 text-off-white/80">
						<Clock size={18} className="text-[#FF9933] opacity-80" /> 
						Incident History
					</h2>
				</div>
				<div className="glass-panel p-8 flex flex-col items-center justify-center text-center space-y-3 hover:bg-white/[0.02] transition-colors">
					<div className="w-12 h-12 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-2">
						<CheckCircle2 size={24} className="text-[#22C55E] opacity-80" />
					</div>
					<h3 className="text-off-white/90 font-medium">No Incidents</h3>
					<p className="font-mono text-xs text-muted-text">Zero recorded incidents in the last 30 days.</p>
				</div>
			</section>
		</div>
	);
}
