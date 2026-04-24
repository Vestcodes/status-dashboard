import { NextResponse } from 'next/server';
import { executePing } from '@/utils/pingLogic';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'gru1';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await executePing('gru1');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
