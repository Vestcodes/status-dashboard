const fs = require('fs');
const path = '/home/ubuntu/.openclaw/workspace/status-dashboard/src/app/status/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `{s.region || 'Global'}`,
  `'GLOBAL (20 ZONES)'`
);

fs.writeFileSync(path, content);
