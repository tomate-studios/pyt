import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import type { Review } from '../types'

function VerdictIcon({ verdict }: { verdict: string }) {
  if (verdict === 'approved' || verdict === 'clean')
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
  if (verdict === 'review') return <AlertTriangle className="h-5 w-5 text-amber-400" />
  return <XCircle className="h-5 w-5 text-red-400" />
}

const verdictLabel: Record<string, string> = {
  approved: 'Aprobado',
  clean: 'Limpio',
  review: 'Requiere revisión',
  rejected: 'Rechazado',
}

/**
 * Panel que muestra el resultado estructurado de los dos detectores:
 * veredicto, afirmaciones señaladas, motivos, confianza y limitaciones.
 */
export default function ReviewPanel({ review }: { review: Review }) {
  const d = review.disinformation
  const p = review.profanity
  return (
    <div className="space-y-4">
      {/* Detector 1: antidesinformación */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <header className="flex items-center gap-2">
          {d.verdict === 'rejected' ? (
            <ShieldAlert className="h-5 w-5 text-red-400" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          )}
          <h4 className="font-display font-semibold text-white">Detector de antidesinformación científica</h4>
        </header>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <VerdictIcon verdict={d.verdict} />
            <strong>{verdictLabel[d.verdict]}</strong>
          </span>
          <span className="text-muted-foreground">
            Clasificación: <span className="text-slate-200">{d.classification}</span>
          </span>
          <span className="text-muted-foreground">
            Confianza: <span className="text-slate-200">{d.confidence}</span>
          </span>
        </div>

        {d.reasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {d.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        {d.flaggedClaims.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-amber-300">Afirmaciones que requieren revisión:</p>
            {d.flaggedClaims.map((c, i) => (
              <div key={i} className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 text-sm">
                <p className="font-medium text-amber-200">«{c.fragment}» <span className="font-normal text-muted-foreground">— {c.type}</span></p>
                <p className="mt-1 text-slate-300">{c.reason}</p>
                {c.established && <p className="mt-1 text-xs text-muted-foreground">Conocimiento establecido: {c.established}</p>}
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Fuentes consultadas: {d.sourcesConsulted.length > 0 ? d.sourcesConsulted.join(', ') : 'ninguna — este detector no consulta fuentes externas y lo declara abiertamente'}
        </p>
        {d.suggestion && <p className="mt-2 text-sm text-blue-300">Sugerencia: {d.suggestion}</p>}
        <p className="mt-2 text-xs italic text-muted-foreground">{d.limitations}</p>
      </section>

      {/* Detector 2: antigroserías */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <header className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
          <h4 className="font-display font-semibold text-white">Detector de antigroserías</h4>
        </header>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <VerdictIcon verdict={p.verdict} />
            <strong>{verdictLabel[p.verdict]}</strong>
          </span>
          <span className="text-muted-foreground">
            Confianza: <span className="text-slate-200">{p.confidence}</span>
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-300">{p.explanation}</p>
        {p.matches.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {p.matches.map((m, i) => (
              <div key={i} className="rounded-lg border border-red-400/20 bg-red-500/5 px-3 py-2 text-sm">
                <span className="font-medium text-red-300">«{m.fragment}»</span>
                <span className="text-muted-foreground"> — {m.category} ({m.severity === 'high' ? 'gravedad alta' : 'ambigua, gravedad media'})</span>
                {m.context && <p className="mt-0.5 text-xs text-muted-foreground">Contexto: …{m.context}…</p>}
              </div>
            ))}
          </div>
        )}
        {p.suggestion && <p className="mt-2 text-sm text-blue-300">Sugerencia: {p.suggestion}</p>}
        <p className="mt-2 text-xs italic text-muted-foreground">{p.limitations}</p>
      </section>
    </div>
  )
}
