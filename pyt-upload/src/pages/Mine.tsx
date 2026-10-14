import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileEdit, Pencil, User } from 'lucide-react'
import { api } from '../api'
import type { Theory } from '../types'
import TheoryCard from '../components/TheoryCard'

/**
 * Bandeja personal del visitante (identificado por su token de cliente):
 * borradores, pendientes, rechazadas (con informe y opción de reenvío) y
 * publicadas propias. Los borradores rechazados NUNCA se eliminan.
 */
export default function Mine() {
  const [theories, setTheories] = useState<Theory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .mine()
      .then((r) => setTheories(r.theories))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display flex items-center gap-2 text-2xl font-bold text-white">
        <User className="h-6 w-6 text-violet-400" /> Mis teorías
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Aquí ves el estado de revisión de todo lo que has enviado desde este navegador. Las publicaciones
        rechazadas incluyen el informe con el motivo y pueden editarse y reenviarse; nunca se borran.
      </p>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!loading && !error && theories.length === 0 && (
        <div className="glass-card mt-6 p-8 text-center">
          <FileEdit className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Todavía no has enviado ninguna teoría.</p>
          <Link to="/publicar" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
            Publicar mi primera teoría
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {theories.map((t) => (
          <div key={t.id} className="relative">
            <TheoryCard theory={t} showStatus />
            {t.status !== 'published' && (
              <Link
                to={`/publicar?edit=${t.id}`}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar y reenviar
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
