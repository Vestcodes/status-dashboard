import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, projectId } = await req.json();

    if (!email || !projectId) {
      return NextResponse.json({ error: 'Email and projectId are required.' }, { status: 400 });
    }

    // Use Service Role to bypass RLS for inserting subscribers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('subscribers')
      .insert([{ project_id: projectId, email, status: 'active' }]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already subscribed.' }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
