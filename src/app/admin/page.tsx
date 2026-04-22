import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClientProjectForm } from './components/ClientProjectForm'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Admin Portal</h1>
        <form action={async () => {
          'use server'
          const s = await createClient()
          await s.auth.signOut()
          redirect('/login')
        }}>
          <button className="text-sm text-muted-text hover:text-off-white transition-colors">Sign Out</button>
        </form>
      </header>

      <section className="glass-panel p-6 border-l-4 border-l-[#22C55E]">
        <h2 className="text-xl font-medium mb-4">Create New Project</h2>
        <ClientProjectForm />
      </section>

      <section>
        <h2 className="text-xl font-medium mb-4">Managed Projects</h2>
        <div className="grid gap-4">
          {projects?.map(p => (
            <div key={p.id} className="glass-panel p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg">{p.name}</h3>
                <p className="text-sm text-muted-text font-mono">{p.domain}</p>
              </div>
              <Link href={`/admin/projects/${p.id}`} className="text-sm px-3 py-1.5 bg-[#FF9933]/10 text-[#FF9933] border border-[#FF9933]/20 rounded-md hover:bg-[#FF9933]/20 transition-colors">
                Manage Services
              </Link>
            </div>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="text-muted-text text-sm italic p-4">No projects yet. Create one above.</div>
          )}
        </div>
      </section>
    </div>
  )
}
