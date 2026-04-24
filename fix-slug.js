const fs = require('fs');
const path = '/home/ubuntu/.openclaw/workspace/status-dashboard/src/app/status/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`	const uptimeStats: Record<string, { total: number, up: number }> = {};
	if (latestStatuses) {`, 
`	const statusMap: Record<string, any> = {};
	const uptimeStats: Record<string, { total: number, up: number }> = {};
	if (latestStatuses) {`
);

fs.writeFileSync(path, content);
