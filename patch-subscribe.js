const fs = require('fs');
const path = '/home/ubuntu/.openclaw/workspace/status-dashboard/src/app/status/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const subscribeComponent = `
import { SubscribeForm } from '@/components/SubscribeForm';
`;

// Add import at the top
content = content.replace(`import { UptimeHistoryHeatmap } from "@/components/UptimeHistoryHeatmap";`, 
`import { UptimeHistoryHeatmap } from "@/components/UptimeHistoryHeatmap";
import { SubscribeForm } from "@/components/SubscribeForm";`);

// Add SubscribeForm below the incident button
content = content.replace(
`<div className="flex items-center gap-4 pt-2">
					<Link href={\`/status/\${slug}/incidents\`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-off-white transition-all">
						<AlertTriangle size={14} className="text-[#F59E0B]" />
						View Incident History
						<ArrowRight size={14} className="opacity-50" />
					</Link>
				</div>`,
`<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
					<Link href={\`/status/\${slug}/incidents\`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-off-white transition-all h-[42px]">
						<AlertTriangle size={14} className="text-[#F59E0B]" />
						View Incident History
						<ArrowRight size={14} className="opacity-50" />
					</Link>
					<SubscribeForm projectId={project.id} />
				</div>`
);

fs.writeFileSync(path, content);
