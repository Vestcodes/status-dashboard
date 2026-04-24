import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host');
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : `${protocol}://${host}`;

  const regions = [
    'arn1', 'bom1', 'cdg1', 'cle1', 'cpt1', 'dub1', 'dxb1', 'fra1', 
    'gru1', 'hkg1', 'hnd1', 'iad1', 'icn1', 'kix1', 'lhr1', 'pdx1', 
    'sfo1', 'sin1', 'syd1', 'yul1'
  ];

  const promises = regions.map(async (region) => {
    try {
      const response = await fetch(`${baseUrl}/api/ping/${region}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
        }
      });
      return { region, status: response.status, ok: response.ok };
    } catch (e: any) {
      return { region, error: e.message };
    }
  });

  const results = await Promise.all(promises);

  return NextResponse.json({
    message: 'Fan-out to all 20 regional endpoints initiated',
    results
  });
}
