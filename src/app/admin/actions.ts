'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProject(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const domain = formData.get('domain') as string

  const { error } = await supabase
    .from('projects')
    .insert({ name, slug, domain })

  if (error) {
    console.error('Error adding project:', error)
    throw new Error('Failed to add project')
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function addService(formData: FormData) {
  const supabase = await createClient()

  const project_id = formData.get('project_id') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const region = formData.get('region') as string
  const endpoint = formData.get('endpoint') as string

  const { error } = await supabase
    .from('services')
    .insert({ project_id, name, type, region, endpoint })

  if (error) {
    console.error('Error adding service:', error)
    throw new Error('Failed to add service')
  }

  revalidatePath(`/admin/projects/${project_id}`)
}
