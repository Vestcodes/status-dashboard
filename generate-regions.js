const fs = require('fs');
const path = require('path');

const regions = ['iad1', 'fra1', 'bom1', 'syd1', 'gru1', 'hnd1'];

regions.forEach(region => {
  const dir = path.join(__dirname, `src/app/api/ping/${region}`);
  fs.mkdirSync(dir, { recursive: true });
  
  const content = `import { NextResponse } from 'next/server';
import { executePing } from '@/utils/pingLogic';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = '${region}';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await executePing('${region}');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
  fs.writeFileSync(path.join(dir, 'route.ts'), content);
});
console.log('Region routes generated');
