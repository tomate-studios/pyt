import { Link, NavLink } from 'react-router-dom'
import { FlaskConical, Home, Rocket, Telescope, User } from 'lucide-react'
import Starfield from './Starfield'

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/publicar', label: 'Publicar teoría', icon: Rocket },
  { to: '/mis-teorias', label: 'Mis teorías', icon: User },
  { to: '/laboratorio', label: 'Laboratorio de pruebas', icon: FlaskConical },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Starfield />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[hsl(232_47%_5%/0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <Telescope className="h-7 w-7 text-violet-400" />
            <span className="font-display text-2xl font-bold tracking-wide text-white glow-title">
              P.Y.T.
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Plataforma de Teorías del universo
            </span>
          </Link>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-violet-500/20 text-violet-200'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden">{label.split(' ')[0]}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {import.meta.env.VITE_STATIC === 'true' && (
          <div className="mb-6 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-center text-xs text-violet-200">
            <strong>Versión demo estática</strong> (GitHub Pages): los dos detectores funcionan igual que en la
            versión completa, pero las publicaciones, likes y comentarios se guardan <strong>solo en este
            navegador</strong> — no hay base de datos compartida.
          </div>
        )}
        {children}
      </main>

      <footer className="relative z-10 mt-16 border-t border-white/10 py-6 text-center text-xs text-muted-foreground">
        <p>
          P.Y.T. — Plataforma de Teorías · Comunidad científica sobre el universo real · v1 de prueba
        </p>
        <p className="mt-1">
          Toda publicación pasa por dos detectores independientes antes de hacerse pública.
        </p>
      </footer>
    </div>
  )
}
