'use client'

import { useRef, useState } from 'react'
import { addService } from '../actions'
import { SubmitButton } from './SubmitButton'

export function ClientServiceForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  async function action(formData: FormData) {
    setError(null)
    setSuccess(false)
    try {
      await addService(formData)
      setSuccess(true)
      formRef.current?.reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message || "Failed to add service")
    }
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 max-w-xl">
      {error && <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">{error}</div>}
      {success && <div className="text-green-400 text-sm bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20">Service added successfully!</div>}
      
      <input type="hidden" name="project_id" value={projectId} />
      
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
      
      <SubmitButton pendingText="Adding Service...">Add Service</SubmitButton>
    </form>
  )
}
