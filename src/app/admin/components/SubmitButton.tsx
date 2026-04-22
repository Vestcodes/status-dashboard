'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children, pendingText = "Submitting..." }: { children: React.ReactNode, pendingText?: string }) {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="self-start bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending ? (
        <>
          <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          {pendingText}
        </>
      ) : children}
    </button>
  )
}
