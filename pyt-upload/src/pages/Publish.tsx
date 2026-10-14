import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, Rocket, XCircle } from 'lucide-react'
import { api, type TheoryInput } from '../api'
import type { Theory } from '../types'
import ReviewPanel from '../components/ReviewPanel'

const empty: TheoryInput = { title: '', category: '', summary: '', content: '', sources: '', author: '' }

const reviewSteps = [
  'Paso 3 · Ejecutando el detector de antidesinformación científica…',
  'Paso 4 · Ejecutando el detector de antigroserías…',
  'Paso 5 · Combinando resultados…',
]

export default function Publish() {
  const [params] = useSearchParams()
  const editId = params.get('edit') ? Number(params.get('edit')) : null
  const navigate = useNavigate()

  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState<TheoryInput>(empty)
  // Tras el primer envío, el registro existe en la BD: los reenvíos lo actualizan (PUT)
  const [recordId, setRecordId] = useState<number | null>(editId)
  const [submitting, setSubmitting] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState<Theory | null>(null)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories)).catch(() => {})
    if (editId) {
      api
        .getTheory(editId)
        .then((r) => {
          const t = r.theory
          if (!t.mine) {
            setError('No puedes editar publicaciones ajenas.')
            return
          }
          setForm({ title: t.title, category: t.category, summary: t.summary, content: t.content, sources: t.sources, author: t.author })
        })
        .catch(() => setError('No se pudo cargar el borrador.'))
    }
  }, [editId])

  const set = (k: keyof TheoryInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors([])
    setResult(null)
    setSubmitting(true)
    setStepIdx(0)
    // Animación de los pasos del pipeline mientras llega la respuesta real
    const timer = setInterval(() => setStepIdx((i) => Math.min(i + 1, reviewSteps.length - 1)), 700)
    try {
      const r = recordId ? await api.updateTheory(recordId, form) : await api.submitTheory(form)
      setRecordId(r.theory.id)
      setResult(r.theory)
    } catch (err) {
      const e2 = err as Error & { details?: string[] }
      if (e2.details) setValidationErrors(e2.details)
      else setError(e2.message)
    } finally {
      clearInterval(timer)
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/60 focus:outline-none'

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display flex items-center gap-2 text-2xl font-bold text-white">
        <Rocket className="h-6 w-6 text-violet-400" />
        {recordId ? 'Editar y volver a enviar' : 'Publicar teoría'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu publicación NO aparecerá públicamente hasta superar dos verificaciones independientes: el
        detector de antidesinformación científica y el detector antigroserías. Si alguno no llega a una
        conclusión fiable, quedará pendiente de revisión. Tu borrador nunca se elimina.
      </p>

      <form onSubmit={submit} className="glass-card mt-6 space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">1 · Título de la teoría *</label>
          <input className={inputCls} value={form.title} onChange={set('title')} minLength={5} maxLength={140} required placeholder="Ej.: Hipótesis sobre la naturaleza de la energía oscura" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">2 · Categoría *</label>
            <select className={inputCls} value={form.category} onChange={set('category')} required>
              <option value="" disabled>Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">6 · Nombre o seudónimo *</label>
            <input className={inputCls} value={form.author} onChange={set('author')} minLength={2} maxLength={40} required placeholder="Tu nombre visible" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">3 · Resumen * (20–500 caracteres)</label>
          <textarea className={`${inputCls} min-h-20`} value={form.summary} onChange={set('summary')} minLength={20} maxLength={500} required placeholder="Resume tu idea en un par de frases" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">4 · Explicación completa * (mínimo 100 caracteres)</label>
          <textarea className={`${inputCls} min-h-48`} value={form.content} onChange={set('content')} minLength={100} maxLength={20000} required placeholder="Desarrolla tu teoría. Distingue claramente hechos, hipótesis y especulación." />
          <p className="mt-1 text-xs text-muted-foreground">{form.content.length} / 20000</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">5 · Fuentes, referencias o enlaces científicos (opcional)</label>
          <textarea className={`${inputCls} min-h-20`} value={form.sources} onChange={set('sources')} maxLength={3000} placeholder="Ej.: arXiv:1001.0785, https://doi.org/…" />
        </div>

        {validationErrors.length > 0 && (
          <ul className="list-disc space-y-1 rounded-lg border border-red-400/30 bg-red-500/10 p-3 pl-8 text-sm text-red-300">
            {validationErrors.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        )}
        {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-900/40 transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          <Rocket className="h-4 w-4" /> {submitting ? 'Revisando…' : 'Enviar para revisión'}
        </button>
      </form>

      {/* Indicador de revisión */}
      {submitting && (
        <div className="glass-card mt-6 p-6">
          <p className="font-display font-semibold text-white">Revisión en curso</p>
          <ul className="mt-3 space-y-2 text-sm">
            {reviewSteps.map((s, i) => (
              <li key={i} className={`flex items-center gap-2 ${i <= stepIdx ? 'text-slate-200' : 'text-muted-foreground/50'}`}>
                {i < stepIdx ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : i === stepIdx ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-white/20" />
                )}
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="mt-6 space-y-4">
          {result.status === 'published' && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-emerald-300">
                <CheckCircle2 className="h-5 w-5" /> ¡Teoría publicada!
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Ambos detectores aprobaron tu publicación y ya es visible en la página principal.
              </p>
              <div className="mt-3 flex gap-3">
                <Link to={`/teoria/${result.id}`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Ver publicación</Link>
                <button onClick={() => navigate('/')} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Ir al inicio</button>
              </div>
            </div>
          )}

          {result.status === 'pending' && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-amber-300">
                <Clock className="h-5 w-5" /> Pendiente de revisión
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Alguno de los detectores no pudo llegar a una conclusión fiable, así que tu publicación NO
                se ha hecho pública todavía. No es un rechazo: queda guardada en «Mis teorías» y puedes
                mejorarla y volver a enviarla.
              </p>
              <Link to="/mis-teorias" className="mt-3 inline-block rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Ver en Mis teorías</Link>
            </div>
          )}

          {result.status === 'rejected' && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-red-300">
                <XCircle className="h-5 w-5" /> Publicación rechazada en revisión
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Abajo tienes el motivo del rechazo, qué parte del texto lo provocó y una sugerencia para
                corregirla. Tu borrador NO se ha eliminado: edítalo y vuelve a enviarlo cuando quieras.
              </p>
              <a href="#formulario" onClick={(e) => { e.preventDefault(); setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="mt-3 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
                Editar y volver a enviar
              </a>
            </div>
          )}

          {result.review && <ReviewPanel review={result.review} />}
        </div>
      )}
    </div>
  )
}
