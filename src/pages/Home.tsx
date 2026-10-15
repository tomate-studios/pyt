import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Rocket, Search, Telescope } from 'lucide-react'
import { api } from '../api'
import type { Theory } from '../types'
import TheoryCard from '../components/TheoryCard'

export default function Home() {
  const [categories, setCategories] = useState<string[]>([])
  const [recent, setRecent] = useState<Theory[]>([])
  const [popular, setPopular] = useState<Theory[]>([])
  const [results, setResults] = useState<Theory[] | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const filtering = search.trim() !== '' || category !== ''

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories)).catch(() => {})
    Promise.all([api.listTheories({ sort: 'recent' }), api.listTheories({ sort: 'popular' })])
      .then(([r, p]) => {
        setRecent(r.theories)
        setPopular(p.theories.slice(0, 4))
      })
      .catch(() => setError('No se pudieron cargar las publicaciones. ¿Está el servidor en marcha?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!filtering) {
      setResults(null)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      api
        .listTheories({ search: search.trim(), category, sort: 'recent' })
        .then((r) => setResults(r.theories))
        .catch(() => setError('Error al buscar.'))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [search, category, filtering])

  const popularIds = useMemo(() => new Set(popular.map((t) => t.id)), [popular])
  const recentFiltered = recent.filter((t) => !popularIds.has(t.id)).slice(0, 8)

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center">
        <h1 className="font-display text-5xl font-bold tracking-wide text-white glow-title sm:text-6xl">
          P.Y.T.
        </h1>
        <p className="mt-2 font-display text-lg text-violet-300">Plataforma de Teorías</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Una comunidad donde cualquier persona puede proponer hipótesis, modelos y teorías sobre el
          universo real: cosmología, gravedad, agujeros negros, relatividad, mecánica cuántica y más.
          Toda publicación pasa por un detector de antidesinformación científica y un detector
          antigroserías antes de hacerse pública.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/publicar"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-violet-900/40 transition-transform hover:scale-105"
          >
            <Rocket className="h-4 w-4" /> Publicar teoría
          </Link>
          <Link
            to="/laboratorio"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/5"
          >
            Probar los detectores
          </Link>
        </div>
      </section>

      {/* Buscador */}
      <section className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar teorías por título, contenido o autor…"
            className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/60 focus:outline-none"
          />
        </div>
      </section>

      {/* Categorías */}
      <section className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            category === ''
              ? 'border-violet-400/60 bg-violet-500/25 text-violet-100'
              : 'border-white/15 text-muted-foreground hover:bg-white/5 hover:text-white'
          }`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? '' : c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              category === c
                ? 'border-violet-400/60 bg-violet-500/25 text-violet-100'
                : 'border-white/15 text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </section>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
      {loading && <p className="text-center text-sm text-muted-foreground">Cargando publicaciones…</p>}

      {/* Resultados de búsqueda/filtro */}
      {!loading && filtering && results && (
        <section>
          <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Telescope className="h-5 w-5 text-blue-400" />
            Resultados ({results.length})
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay publicaciones que coincidan con la búsqueda.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((t) => (
                <TheoryCard key={t.id} theory={t} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Secciones por defecto */}
      {!filtering && !loading && (
        <>
          <section>
            <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Flame className="h-5 w-5 text-violet-400" /> Teorías populares
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((t) => (
                <TheoryCard key={t.id} theory={t} />
              ))}
            </div>
          </section>

          <div className="nebula-divider" />

          <section>
            <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Telescope className="h-5 w-5 text-blue-400" /> Publicaciones recientes
            </h2>
            {recentFiltered.length === 0 && popular.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">
                  Aún no hay teorías publicadas por la comunidad. ¡Sé la primera persona en publicar!
                </p>
                <Link to="/publicar" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
                  <Rocket className="h-4 w-4" /> Publicar teoría
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentFiltered.map((t) => (
                  <TheoryCard key={t.id} theory={t} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
