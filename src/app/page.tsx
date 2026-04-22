import { Activity, AlertTriangle, CheckCircle2, Clock, Server, Globe2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const projects = [
	{
		name: "Vestcodes Core",
		slug: "vestcodes",
		domain: "status.vestcodes.co",
		uptime: "99.99%",
		status: "operational",
		services: [
		  { name: "API", region: "iad1", latency: "45ms", status: "operational" },
		  { name: "Postgres", region: "fra1", latency: "62ms", status: "operational" }
		]
	},
	{
		name: "EasyCareHub",
		slug: "ech",
		domain: "ech.status.vestcodes.co",
		uptime: "100%",
		status: "operational",
		services: [
		  { name: "API", region: "iad1", latency: "38ms", status: "operational" },
		  { name: "Cron", region: "global", latency: "110ms", status: "operational" }
		]
	},
	{
		name: "Sunny AI Assistant",
		slug: "sunny",
		domain: "sunny.status.vestcodes.co",
		uptime: "100%",
		status: "operational",
		services: [
		  { name: "Inference", region: "global", latency: "400ms", status: "operational" },
		  { name: "Gateway", region: "iad1", latency: "42ms", status: "operational" }
		]
	},
];

export default function Home() {
	return (
		<div className="space-y-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
			<header className="space-y-4 pt-4">
				<div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel border border-[#22C55E]/20 bg-[#22C55E]/5 mb-4">
					<div className="status-dot operational"></div>
					<span className="text-sm font-medium text-[#22C55E]">All Systems Operational</span>
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
					<button className="text-xs mono-accent px-3 py-1.5 glass-panel hover:bg-white/5 transition-colors">
						+ Add Project
					</button>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{projects.map((p) => (
						<div key={p.slug} className="glass-panel p-6 flex flex-col group relative overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.03]">
							{/* Subtle background glow effect */}
							<div className="absolute -top-24 -right-24 w-48 h-48 bg-[#22C55E] opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
							
							<div className="flex justify-between items-start mb-6 z-10">
								<div>
									<h3 className="text-xl font-medium text-off-white/90 mb-1">{p.name}</h3>
									<div className="flex items-center gap-2">
										<Globe2 size={12} className="text-muted-text" />
										<a href={`https://${p.domain}`} target="_blank" className="mono-accent text-muted-text text-[11px] hover:text-[#FF9933] transition-colors">
											{p.domain}
										</a>
									</div>
								</div>
								<div className="p-2 bg-white/5 rounded-full">
									<MoreHorizontal size={16} className="text-muted-text" />
								</div>
							</div>

							<div className="space-y-3 z-10 flex-1">
								{p.services.map(s => (
									<div key={s.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
										<div className="flex items-center gap-3">
											<div className={`status-dot ${s.status}`}></div>
											<span className="text-sm text-off-white/80">{s.name}</span>
											<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-muted-text uppercase">{s.region}</span>
										</div>
										<span className="font-mono text-xs text-muted-text">{s.latency}</span>
									</div>
								))}
							</div>

							<div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center z-10">
								<span className="font-mono text-xs text-muted-text">UPTIME 30D</span>
								<span className="font-mono text-sm text-[#22C55E]">{p.uptime}</span>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="space-y-6 pt-8">
				<div className="flex items-center justify-between pb-4 border-b border-white/10">
					<h2 className="text-xl font-medium tracking-wide flex items-center gap-3 text-off-white/80">
						<Clock size={18} className="text-[#FF9933] opacity-80" /> 
						Incident History
					</h2>
				</div>
				<div className="glass-panel p-8 flex flex-col items-center justify-center text-center space-y-3">
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
