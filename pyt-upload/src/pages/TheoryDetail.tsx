import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, Heart, MessageCircle, Send, Sparkles } from 'lucide-react'
import { api, formatDate } from '../api'
import type { Comment, Theory } from '../types'
import StatusBadge from '../components/StatusBadge'
import ReviewPanel from '../components/ReviewPanel'

export default function TheoryDetail() {
  const { id } = useParams()
  const [theory, setTheory] = useState<Theory | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [error, setError] = useState('')
  const [likeBusy, setLikeBusy] = useState(false)
  const [author, setAuthor] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentMsg, setCommentMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    api
      .getTheory(id!)
      .then((r) => {
        setTheory(r.theory)
        setComments(r.comments)
      })
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(load, [load])

  const toggleLike = async () => {
    if (!theory || likeBusy) return
    setLikeBusy(true)
    try {
      const r = await api.toggleLike(theory.id)
      setTheory({ ...theory, likedByMe: r.liked, likes: r.likes })
    } catch {
      /* ignorar */
    } finally {
      setLikeBusy(false)
    }
  }

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!theory) return
    setSending(true)
    setCommentMsg(null)
    try {
      const r = await api.addComment(theory.id, author.trim(), commentText.trim())
      setComments([...comments, r.comment])
      setCommentText('')
      setCommentMsg({ ok: true, text: 'Comentario publicado (superó el detector antigroserías).' })
    } catch (err) {
      const e2 = err as Error & { payload?: { review?: { matches?: { fragment: string }[] } } }
      const frags = e2.payload?.review?.matches?.map((m) => `«${m.fragment}»`).join(', ')
      setCommentMsg({
        ok: false,
        text: frags
          ? `Comentario rechazado por lenguaje inapropiado: ${frags}. Reformúlalo con respeto.`
          : e2.message,
      })
    } finally {
      setSending(false)
    }
  }

  if (error)
    return (
      <div className="glass-card mx-auto max-w-xl p-8 text-center">
        <p className="text-red-400">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-blue-300 hover:underline">Volver al inicio</Link>
      </div>
    )
  if (!theory) return <p className="text-center text-sm text-muted-foreground">Cargando…</p>

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
            {theory.category}
          </span>
          {theory.isExample && (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
              <Sparkles className="h-3 w-3" /> Ejemplo editorial de la plataforma
            </span>
          )}
          <StatusBadge status={theory.status} />
        </div>

        <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-white">{theory.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          por <span className="text-slate-200">{theory.author}</span> · {formatDate(theory.createdAt)}
        </p>

        <div className="nebula-divider my-5" />

        <p className="text-base italic text-slate-300">{theory.summary}</p>

        <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200">
          {theory.content}
        </div>

        {theory.sources.trim() && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-300">
              <BookOpen className="h-4 w-4" /> Fuentes y referencias
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{theory.sources}</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={likeBusy}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
              theory.likedByMe
                ? 'border-rose-400/50 bg-rose-500/15 text-rose-300'
                : 'border-white/15 text-slate-200 hover:bg-white/5'
            }`}
          >
            <Heart className={`h-4 w-4 ${theory.likedByMe ? 'fill-rose-400 text-rose-400' : ''}`} />
            Me gusta · {theory.likes}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" /> {comments.length} comentarios
          </span>
        </div>
      </div>

      {theory.review && (
        <details className="glass-card p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">
            Ver informe de revisión de los detectores
          </summary>
          <div className="mt-4">
            <ReviewPanel review={theory.review} />
          </div>
        </details>
      )}

      {/* Comentarios */}
      <section className="glass-card p-6">
        <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-white">
          <MessageCircle className="h-5 w-5 text-violet-400" /> Comentarios
        </h2>
        <div className="mt-4 space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay comentarios. ¡Sé la primera persona!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-slate-300">{c.author}</span> · {formatDate(c.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{c.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={sendComment} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Tu nombre o seudónimo"
              maxLength={40}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/60 focus:outline-none"
            />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario respetuoso…"
              maxLength={1500}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/60 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending || author.trim().length < 2 || commentText.trim().length < 2}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> {sending ? 'Enviando…' : 'Comentar'}
          </button>
          {commentMsg && (
            <p className={`text-sm ${commentMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{commentMsg.text}</p>
          )}
        </form>
      </section>
    </article>
  )
}
