'use client'

import { useRef, useState } from 'react'
import { addProject } from '../actions'
import { SubmitButton } from './SubmitButton'

export function ClientProjectForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  async function action(formData: FormData) {
    setError(null)
    setSuccess(false)
    try {
      await addProject(formData)
      setSuccess(true)
      formRef.current?.reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message || "Failed to add project")
    }
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 max-w-xl relative">
      {error && <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">{error}</div>}
      {success && <div className="text-green-400 text-sm bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20">Project added successfully!</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-text mb-1">Project Name</label>
          <input name="name" required placeholder="e.g. Vestcodes Core" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none" />
        </div>
        <div>
          <label className="block text-sm text-muted-text mb-1">Slug</label>
          <input name="slug" required placeholder="e.g. vestcodes" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted-text mb-1">Domain</label>
        <input name="domain" required placeholder="e.g. status.vestcodes.co" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#FF9933]/50 outline-none" />
      </div>
      <SubmitButton pendingText="Adding...">Add Project</SubmitButton>
    </form>
  )
}
