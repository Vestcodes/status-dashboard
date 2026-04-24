import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/utils/mailer';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { projectId, incidentId, status, body } = await req.json();

    if (!projectId || !incidentId || !status || !body) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch Project Details
    const { data: project } = await supabase
      .from('projects')
      .select('name, domain')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Fetch Active Subscribers
    const { data: subscribers } = await supabase
      .from('subscribers')
      .select('email')
      .eq('project_id', projectId)
      .eq('status', 'active');

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers to notify.' });
    }

    const emails = subscribers.map((sub) => sub.email);

    // 3. Construct the Email
    const subject = `[${project.name} Status] Incident Update: ${status.toUpperCase()}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #FF9933;">${project.name} Status Update</h2>
        <p>There has been an update regarding an ongoing incident on <strong>${project.domain}</strong>.</p>
        
        <div style="background-color: #f4f4f5; padding: 16px; border-left: 4px solid #FF9933; margin: 20px 0;">
          <strong>Status:</strong> <span style="text-transform: uppercase;">${status}</span><br><br>
          ${body}
        </div>
        
        <p style="font-size: 12px; color: #666; margin-top: 40px;">
          You received this email because you are subscribed to status updates for ${project.name}.<br>
          <a href="https://status.vestcodes.co">Manage Subscriptions</a>
        </p>
      </div>
    `;

    // 4. Send Email via Nodemailer
    const emailSent = await sendEmail({
      to: emails,
      subject,
      html,
    });

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send emails via SMTP.' }, { status: 500 });
    }

    // 5. Update Incident Update Record to mark as notified
    await supabase
      .from('incident_updates')
      .update({ notified_subscribers: true })
      .eq('incident_id', incidentId)
      .eq('status', status);

    return NextResponse.json({ success: true, message: `Notified ${emails.length} subscribers.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
