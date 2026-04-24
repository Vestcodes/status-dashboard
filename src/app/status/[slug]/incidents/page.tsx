import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IncidentsPage({ params }: { params: { slug: string } }) {
	const slug = params.slug;
	const supabase = await createClient();

	const { data: project } = await supabase
		.from('projects')
		.select('*')
		.eq('slug', slug)
		.single();

	if (!project) {
		notFound();
	}

	const { data: incidents } = await supabase
		.from('incidents')
		.select('*')
		.eq('project_id', project.id)
		.order('created_at', { ascending: false });

	return (
		<div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
			<Link
				href={`/status/${slug}`}
				className="mono-accent text-muted-text hover:text-off-white flex items-center gap-2 mb-8 transition-colors"
			>
				<ArrowLeft size={16} /> BACK TO STATUS
			</Link>

			<header className="space-y-6 pb-8 border-b border-white/10">
				<div>
					<h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-off-white mb-2">
						{project.name} Incidents
					</h1>
					<p className="font-mono text-muted-text text-[0.95rem] max-w-2xl leading-relaxed">
						Historical incident log and downtime tracking for {project.domain}.
					</p>
				</div>
			</header>

			<section className="space-y-6">
				{(!incidents || incidents.length === 0) ? (
					<div className="glass-panel p-12 flex flex-col items-center justify-center text-center space-y-4">
						<div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-2">
							<CheckCircle2 size={32} className="text-[#22C55E] opacity-80" />
						</div>
						<h3 className="text-xl text-off-white/90 font-medium">Clean Record</h3>
						<p className="font-mono text-sm text-muted-text">Zero incidents have been reported for this application.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6">
						{incidents.map((incident: any) => (
							<div key={incident.id} className="glass-panel p-6 relative overflow-hidden group hover:bg-white/[0.03] transition-all">
								<div className={`absolute left-0 top-0 bottom-0 w-1 ${
									incident.status === 'resolved' ? 'bg-[#22C55E]' :
									incident.status === 'investigating' ? 'bg-[#F59E0B]' :
									'bg-[#EF4444]'
								}`} />
								
								<div className="flex justify-between items-start mb-4">
									<div>
										<h3 className="text-xl font-medium text-off-white/90 mb-2">{incident.title}</h3>
										<span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider ${
											incident.status === 'resolved' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
											incident.status === 'investigating' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
											'bg-[#EF4444]/10 text-[#EF4444]'
										}`}>
											{incident.status}
										</span>
									</div>
									<div className="text-right">
										<div className="flex items-center gap-1.5 text-xs font-mono text-muted-text mb-1">
											<Clock size={12} />
											{new Date(incident.created_at).toLocaleDateString()}
										</div>
									</div>
								</div>
								
								<div className="text-sm text-muted-text/90 leading-relaxed border-t border-white/5 pt-4">
									{incident.description || 'No description provided.'}
								</div>
								
								{incident.resolved_at && (
									<div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-muted-text">
										<CheckCircle2 size={12} className="text-[#22C55E]" />
										Resolved on {new Date(incident.resolved_at).toLocaleString()}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
