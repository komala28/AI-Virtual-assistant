import { Link } from 'react-router-dom';
import { Sparkles, Brain, ShieldCheck, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0a0a0b]">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles size={20} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Aria</span>
        </Link>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your intelligent<br />AI assistant.
          </h1>
          <p className="mt-4 max-w-md text-blue-100">
            Chat, write, code, and analyze documents — all in one beautifully designed workspace.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Zap, title: 'Instant responses', desc: 'Streaming answers with markdown and code highlighting' },
              { icon: Brain, title: 'Document analysis', desc: 'Summarize PDFs, ask questions about your files' },
              { icon: ShieldCheck, title: 'Private & secure', desc: 'Your conversations stay yours, always' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <f.icon size={17} />
                </div>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-blue-100">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-blue-200">© 2026 Aria Assistant</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Sparkles size={19} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-800 dark:text-white">Aria</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
