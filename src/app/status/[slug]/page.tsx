"use client";
import { Activity, ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function StatusPage() {
	const params = useParams();
	const slug = params.slug as string;

	return (
		<div className="space-y-12">
			<Link
				href="/"
				className="mono-accent text-sun-yellow hover:text-sun-orange flex items-center gap-2 mb-8"
			>
				<ArrowLeft size={16} /> RETURN_TO_DASHBOARD
			</Link>

			<header className="space-y-4 border-b border-steel-gray pb-8">
				<div className="flex items-center gap-4">
					<h1 className="text-4xl md:text-6xl font-black uppercase text-off-white">
						{slug.toUpperCase()}
					</h1>
					<span className="bg-[#00FF00]/20 text-[#00FF00] px-3 py-1 font-mono text-sm border border-[#00FF00] flex items-center gap-2">
						<span className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse" />{" "}
						OPERATIONAL
					</span>
				</div>
				<p className="font-mono text-off-white/60">
					Latency and historical uptime for {slug}.
				</p>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-steel-gray/20 p-6 brutal-border">
					<div className="mono-accent text-off-white/50 mb-2 flex items-center gap-2">
						<Activity size={14} /> CURRENT_LATENCY
					</div>
					<div className="text-4xl font-bold">45ms</div>
					<div className="text-xs text-sun-yellow font-mono mt-2">
						Region: iad1
					</div>
				</div>
				<div className="bg-steel-gray/20 p-6 brutal-border">
					<div className="mono-accent text-off-white/50 mb-2 flex items-center gap-2">
						<Clock size={14} /> 30_DAY_UPTIME
					</div>
					<div className="text-4xl font-bold">99.99%</div>
					<div className="text-xs text-sun-yellow font-mono mt-2">
						100% SLA Maintained
					</div>
				</div>
				<div className="bg-steel-gray/20 p-6 brutal-border">
					<div className="mono-accent text-off-white/50 mb-2 flex items-center gap-2">
						<ShieldCheck size={14} /> LAST_CHECK
					</div>
					<div className="text-4xl font-bold">2m ago</div>
					<div className="text-xs text-sun-yellow font-mono mt-2">
						Automated Ping
					</div>
				</div>
			</div>

			<section>
				<h2 className="text-xl font-bold uppercase mb-6">
					Uptime History (Last 90 Days)
				</h2>
				<div className="flex gap-1 overflow-x-auto pb-4">
					{Array.from({ length: 90 }).map((_, i) => {
						const key = `day-${i}`;
						return (
							<div
								key={key}
								className="w-4 h-12 rounded-sm shrink-0"
								style={{
									backgroundColor: Math.random() > 0.05 ? "#00FF00" : "#FFD600",
								}}
								title="Operational"
							/>
						);
					})}
				</div>
			</section>
		</div>
	);
}
