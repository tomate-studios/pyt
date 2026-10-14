import { Link } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'
import type { Theory } from '../types'
import { formatDate } from '../api'
import StatusBadge from './StatusBadge'

export default function TheoryCard({ theory, showStatus = false }: { theory: Theory; showStatus?: boolean }) {
  return (
    <Link to={`/teoria/${theory.id}`} className="glass-card rise block p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 border border-blue-400/30">
          {theory.category}
        </span>
        {theory.isExample && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-300 border border-violet-400/30">
            <Sparkles className="h-3 w-3" /> Ejemplo editorial
          </span>
        )}
        {showStatus && <StatusBadge status={theory.status} />}
      </div>
      <h3 className="font-display text-lg font-semibold leading-snug text-white">{theory.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{theory.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          por <span className="text-slate-300">{theory.author}</span> · {formatDate(theory.createdAt)}
        </span>
        <span className="flex items-center gap-1 text-slate-300">
          <Heart className={`h-3.5 w-3.5 ${theory.likedByMe ? 'fill-rose-400 text-rose-400' : ''}`} />
          {theory.likes}
        </span>
      </div>
    </Link>
  )
}
