import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClientServiceForm } from '../../components/ClientServiceForm'

export default async function ProjectAdminPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) return <div>Project not found</div>

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('project_id', params.id)

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-muted-text hover:text-off-white transition-colors">← Back</Link>
        <h1 className="text-2xl font-semibold">{project.name} Services</h1>
      </div>

      <section className="glass-panel p-6 border-l-4 border-l-[#FF9933]">
        <h2 className="text-xl font-medium mb-4">Add Monitored Service</h2>
        <ClientServiceForm projectId={project.id} />
      </section>

      <section>
        <h2 className="text-xl font-medium mb-4">Configured Services</h2>
        <div className="grid gap-3">
          {services?.map(s => (
            <div key={s.id} className="glass-panel p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 uppercase text-muted-text border border-white/5">{s.type}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 uppercase text-muted-text border border-white/5">{s.region}</span>
                </div>
                <p className="text-xs text-muted-text font-mono mt-1 truncate max-w-md">{s.endpoint || 'No endpoint configured'}</p>
              </div>
              <form action={async () => {
                'use server'
                const client = await createClient()
                await client.from('services').delete().eq('id', s.id)
                redirect(`/admin/projects/${project.id}`)
              }}>
                <button type="submit" className="text-xs px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors">Delete</button>
              </form>
            </div>
          ))}
          {(!services || services.length === 0) && (
            <div className="text-muted-text text-sm italic p-4 border border-white/5 rounded-xl border-dashed text-center">No services configured yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
