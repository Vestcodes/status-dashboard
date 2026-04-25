import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  
  const { data: latest } = await supabase.from('statuses').select('checked_at').order('checked_at', { ascending: false }).limit(1);
  const { data: oldestInLimit } = await supabase.from('statuses').select('checked_at').order('checked_at', { ascending: false }).range(99990, 99991);
  
  const { count: servicesCount } = await supabase.from('services').select('*', { count: 'exact', head: true });
  
  return NextResponse.json({
    latest,
    oldestInLimit,
    servicesCount
  });
}
