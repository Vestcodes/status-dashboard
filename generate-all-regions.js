const fs = require('fs');
const path = require('path');

const regions = [
  'arn1', 'bom1', 'cdg1', 'cle1', 'cpt1', 'dub1', 'dxb1', 'fra1', 
  'gru1', 'hkg1', 'hnd1', 'iad1', 'icn1', 'kix1', 'lhr1', 'pdx1', 
  'sfo1', 'sin1', 'syd1', 'yul1'
];

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
console.log('All Region routes generated');
