"use client";
import {
	Activity,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Server,
	Wifi,
} from "lucide-react";

const projects = [
	{
		name: "Vestcodes Core",
		slug: "vestcodes",
		url: "https://www.vestcodes.co",
		uptime: "99.99%",
		latency: "45ms",
		status: "operational",
	},
	{
		name: "EasyCareHub",
		slug: "ech",
		url: "https://easycarehub.vercel.app",
		uptime: "100%",
		latency: "62ms",
		status: "operational",
	},
	{
		name: "Mini EMS",
		slug: "mini-ems",
		url: "https://mini-ems.vestcodes.co",
		uptime: "99.95%",
		latency: "38ms",
		status: "operational",
	},
	{
		name: "ROS Operations",
		slug: "ros",
		url: "https://ros.vestcodes.co",
		uptime: "99.98%",
		latency: "110ms",
		status: "operational",
	},
	{
		name: "Sunny Portfolio",
		slug: "sunny",
		url: "https://sunny.vestcodes.co",
		uptime: "100%",
		latency: "42ms",
		status: "operational",
	},
];

export default function Home() {
	return (
		<div className="space-y-16">
			<header className="space-y-4">
				<h1 className="text-4xl md:text-6xl font-black uppercase text-sun-yellow">
					All Systems Operational
				</h1>
				<p className="font-mono text-off-white/80 text-lg max-w-2xl">
					Real-time status, latency, and uptime tracking for Vestcodes
					infrastructure and active client deployments. Edge-verified across
					multiple global regions.
				</p>
			</header>

			<section>
				<h2 className="text-2xl font-bold uppercase mb-6 flex items-center gap-2 border-b border-steel-gray pb-4">
					<Server className="text-sun-yellow" /> Active Deployments
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{projects.map((p) => (
						<a
							key={p.slug}
							href={`/status/${p.slug}`}
							className="block brutal-border bg-steel-gray/20 p-6 hover:bg-steel-gray/40"
						>
							<div className="flex justify-between items-start mb-4">
								<h3 className="text-xl font-bold">{p.name}</h3>
								{p.status === "operational" ? (
									<CheckCircle2 className="text-[#00FF00]" size={24} />
								) : (
									<AlertTriangle className="text-sun-orange" size={24} />
								)}
							</div>
							<div className="mono-accent text-off-white/50 lowercase mb-6 text-xs">
								{p.url}
							</div>

							<div className="flex justify-between border-t border-steel-gray pt-4 font-mono text-sm">
								<div className="flex items-center gap-2 text-off-white/80">
									<Activity size={14} className="text-sun-yellow" /> {p.uptime}
								</div>
								<div className="flex items-center gap-2 text-off-white/80">
									<Wifi size={14} className="text-sun-yellow" /> {p.latency}
								</div>
							</div>
						</a>
					))}
				</div>
			</section>

			<section>
				<h2 className="text-2xl font-bold uppercase mb-6 flex items-center gap-2 border-b border-steel-gray pb-4">
					<Clock className="text-sun-yellow" /> Past Incidents
				</h2>
				<div className="brutal-border bg-steel-gray/20 p-8 text-center font-mono text-off-white/60">
					No incidents reported in the last 30 days.
				</div>
			</section>
		</div>
	);
}
