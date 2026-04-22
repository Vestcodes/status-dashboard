import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { addService } from '../../actions'
import Link from 'next/link'

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
        <Link href="/admin" className="text-muted-text hover:text-off-white">← Back</Link>
        <h1 className="text-2xl font-semibold">{project.name} Services</h1>
      </div>

      <section className="glass-panel p-6 border-l-4 border-l-[#FF9933]">
        <h2 className="text-xl font-medium mb-4">Add Monitored Service</h2>
        <form action={addService} className="flex flex-col gap-4 max-w-xl">
          <input type="hidden" name="project_id" value={project.id} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-text mb-1">Service Name</label>
              <input name="name" required placeholder="e.g. Core API" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-muted-text mb-1">Type</label>
              <select name="type" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none [&>option]:bg-slate-900">
                <option value="api">API Endpoint</option>
                <option value="db">Database Ping</option>
                <option value="cron">Cron Job</option>
                <option value="external">External Service</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-text mb-1">Target Region</label>
              <select name="region" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none [&>option]:bg-slate-900">
                <option value="global">Global (Any)</option>
                <option value="fra1">Frankfurt (fra1)</option>
                <option value="iad1">Washington DC (iad1)</option>
                <option value="sfo1">San Francisco (sfo1)</option>
                <option value="bom1">Mumbai (bom1)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-text mb-1">Endpoint URL</label>
              <input name="endpoint" type="url" placeholder="https://api.example.com/health" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none" />
            </div>
          </div>
          
          <button type="submit" className="self-start bg-[#FF9933]/10 text-[#FF9933] border border-[#FF9933]/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FF9933]/20 transition-colors">
            Add Service
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-medium mb-4">Configured Services</h2>
        <div className="grid gap-3">
          {services?.map(s => (
            <div key={s.id} className="glass-panel p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 uppercase text-muted-text">{s.type}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 uppercase text-muted-text">{s.region}</span>
                </div>
                <p className="text-xs text-muted-text font-mono mt-1 truncate max-w-md">{s.endpoint || 'No endpoint configured'}</p>
              </div>
            </div>
          ))}
          {(!services || services.length === 0) && (
            <div className="text-muted-text text-sm italic p-4">No services configured yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
