import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
      <div className="glass-panel p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center text-off-white">Sysadmin Login</h1>
        <form className="flex flex-col gap-4">
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
          <button
            formAction={login}
            className="mt-4 w-full bg-[#FF9933]/10 text-[#FF9933] border border-[#FF9933]/20 py-2 rounded-lg font-medium hover:bg-[#FF9933]/20 transition-colors"
          >
            Secure Login
          </button>
        </form>
      </div>
    </div>
  )
}
