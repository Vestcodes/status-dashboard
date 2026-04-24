import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Derive the base URL to call our own regional endpoints
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host');
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : `${protocol}://${host}`;

  const regions = ['iad1', 'fra1', 'bom1', 'syd1', 'gru1', 'hnd1'];

  // Fan-out execution to all configured regions simultaneously
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
    message: 'Fan-out to regional endpoints initiated',
    results
  });
}
