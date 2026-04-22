import { login } from './actions'
import { SubmitButton } from '../admin/components/SubmitButton'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
      <div className="glass-panel p-8 w-full max-w-md border-t-4 border-t-[#FF9933]">
        <h1 className="text-2xl font-semibold mb-6 text-center text-off-white">Sysadmin Login</h1>
        <form action={login} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted-text mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-[#FF9933]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-text mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-[#FF9933]/50 transition-colors"
            />
          </div>
          <div className="mt-4 flex justify-center">
            <SubmitButton pendingText="Authenticating...">Secure Login</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
