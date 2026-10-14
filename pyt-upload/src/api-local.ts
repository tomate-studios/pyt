import type { Comment, LabResult, Review, Theory, TheoryStatus } from './types'
import type { TheoryInput } from './types'
import { CATEGORIES, seedTheories } from './demo/seed'
import { detectDisinformation } from '../server/detectors/disinformation.js'
import { detectProfanity } from '../server/detectors/profanity.js'

/**
 * MODO DEMO ESTÁTICO (GitHub Pages)
 * =================================
 * Implementación local de la API de P.Y.T. que se usa SOLO en la versión
 * estática. Los detectores son exactamente los mismos módulos que ejecuta
 * el backend, pero corriendo en el navegador.
 *
 * AVISO HONESTO (también visible en la interfaz): aquí NO hay base de datos
 * compartida. Las publicaciones, likes y comentarios se guardan en el
 * localStorage de ESTE navegador; cada visitante tiene su propia copia.
 * La versión completa con backend y SQLite compartido está en /server.
 */

const DB_KEY = 'pyt-demo-db-v1'

interface DemoComment extends Comment {
  theoryId: number
}

interface DemoDB {
  nextId: number
  nextCommentId: number
  theories: Theory[]
  comments: DemoComment[]
}

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as DemoDB
  } catch {
    /* datos corruptos: se reinicia */
  }
  const seeded: DemoDB = { nextId: 5, nextCommentId: 1, theories: seedTheories(), comments: [] }
  save(seeded)
  return seeded
}

function save(db: DemoDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// --- Pipeline de revisión: idéntico al del servidor (server/review.js) ------
function reviewSubmission(fields: TheoryInput): { status: TheoryStatus; review: Review } {
  const disinformation = detectDisinformation(fields)
  const profanity = detectProfanity(
    [fields.title, fields.summary, fields.content, fields.sources].filter(Boolean).join('\n'),
  )
  let status: TheoryStatus
  if (disinformation.verdict === 'rejected' || profanity.verdict === 'rejected') status = 'rejected'
  else if (disinformation.verdict === 'review' || profanity.verdict === 'review') status = 'pending'
  else status = 'published'
  return {
    status,
    review: {
      pipelineVersion: 'reglas-locales-v1 (demo en navegador)',
      steps: [
        { step: 3, detector: disinformation.detector, verdict: disinformation.verdict },
        { step: 4, detector: profanity.detector, verdict: profanity.verdict },
      ],
      disinformation,
      profanity,
      decidedAt: new Date().toISOString(),
    },
  }
}

const LIMITS = {
  title: { min: 5, max: 140 },
  summary: { min: 20, max: 500 },
  content: { min: 100, max: 20000 },
  sources: { min: 0, max: 3000 },
  author: { min: 2, max: 40 },
}

function validate(body: TheoryInput): { errors: string[]; clean: TheoryInput } {
  const errors: string[] = []
  const clean = {
    title: body.title.trim(),
    category: body.category,
    summary: body.summary.trim(),
    content: body.content.trim(),
    sources: body.sources.trim(),
    author: body.author.trim(),
  }
  for (const field of ['title', 'summary', 'content', 'sources', 'author'] as const) {
    const lim = LIMITS[field]
    if (clean[field].length < lim.min) errors.push(`El campo «${field}» debe tener al menos ${lim.min} caracteres.`)
    if (clean[field].length > lim.max) errors.push(`El campo «${field}» no puede superar ${lim.max} caracteres.`)
  }
  if (!CATEGORIES.includes(clean.category)) errors.push('Categoría no válida.')
  return { errors, clean }
}

function fail(message: string, extra?: { details?: string[]; payload?: unknown }): never {
  const err = new Error(message) as Error & { details?: string[]; payload?: unknown }
  if (extra?.details) err.details = extra.details
  if (extra?.payload) err.payload = extra.payload
  throw err
}

const now = () => new Date().toISOString()

/** API local con las mismas firmas que la API remota (src/api.ts). */
export const localApi = {
  categories: async () => ({ categories: CATEGORIES }),

  listTheories: async (params: { search?: string; category?: string; sort?: 'recent' | 'popular' }) => {
    const db = load()
    let list = db.theories.filter((t) => t.status === 'published')
    if (params.category) list = list.filter((t) => t.category === params.category)
    if (params.search) {
      const q = norm(params.search)
      list = list.filter((t) => norm(`${t.title} ${t.summary} ${t.content} ${t.author}`).includes(q))
    }
    list.sort((a, b) =>
      params.sort === 'popular'
        ? b.likes - a.likes || b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    )
    return { theories: list }
  },

  getTheory: async (id: number | string) => {
    const db = load()
    const theory = db.theories.find((t) => t.id === Number(id))
    if (!theory) fail('Publicación no encontrada.')
    const comments = db.comments.filter((c) => c.theoryId === theory!.id)
    return { theory: theory!, comments }
  },

  submitTheory: async (input: TheoryInput) => {
    const { errors, clean } = validate(input)
    if (errors.length) fail('Validación fallida.', { details: errors })
    await delay(1600) // da tiempo a ver la animación de los pasos de revisión
    const db = load()
    const { status, review } = reviewSubmission(clean)
    const theory: Theory = {
      id: db.nextId++,
      ...clean,
      status,
      review,
      isExample: false,
      likes: 0,
      likedByMe: false,
      mine: true,
      createdAt: now(),
      updatedAt: now(),
    }
    db.theories.push(theory)
    save(db)
    return { theory }
  },

  updateTheory: async (id: number, input: TheoryInput) => {
    const { errors, clean } = validate(input)
    if (errors.length) fail('Validación fallida.', { details: errors })
    await delay(1600)
    const db = load()
    const theory = db.theories.find((t) => t.id === id)
    if (!theory) fail('Publicación no encontrada.')
    if (theory.isExample) fail('No puedes modificar publicaciones ajenas.')
    if (theory.status === 'published') fail('Las publicaciones ya aprobadas no se editan en esta versión.')
    const { status, review } = reviewSubmission(clean)
    Object.assign(theory, clean, { status, review, updatedAt: now() })
    save(db)
    return { theory }
  },

  mine: async () => {
    const db = load()
    const theories = db.theories
      .filter((t) => !t.isExample)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return { theories }
  },

  toggleLike: async (id: number) => {
    const db = load()
    const theory = db.theories.find((t) => t.id === id && t.status === 'published')
    if (!theory) fail('Publicación no encontrada.')
    theory.likedByMe = !theory.likedByMe
    theory.likes += theory.likedByMe ? 1 : -1
    save(db)
    return { liked: theory.likedByMe, likes: theory.likes }
  },

  addComment: async (id: number, author: string, content: string) => {
    const db = load()
    const theory = db.theories.find((t) => t.id === id && t.status === 'published')
    if (!theory) fail('Publicación no encontrada.')
    if (author.trim().length < 2 || author.trim().length > 40) fail('El nombre debe tener entre 2 y 40 caracteres.')
    if (content.trim().length < 2 || content.trim().length > 1500) fail('El comentario debe tener entre 2 y 1500 caracteres.')
    const check = detectProfanity(`${author}\n${content}`)
    if (check.verdict === 'rejected') {
      fail('Comentario rechazado por el detector antigroserías.', { payload: { review: check } })
    }
    const comment: DemoComment = {
      id: db.nextCommentId++,
      theoryId: id,
      author: author.trim(),
      content: content.trim(),
      createdAt: now(),
    }
    db.comments.push(comment)
    save(db)
    return { comment, moderation: check.verdict === 'review' ? check : null }
  },

  labTest: async (fields: Partial<TheoryInput> & { content: string }) => {
    if (!fields.content.trim()) fail('Escribe un texto para analizar.')
    await delay(600)
    const full: TheoryInput = {
      title: fields.title ?? '',
      category: 'Otras hipótesis',
      summary: fields.summary ?? '',
      content: fields.content,
      sources: fields.sources ?? '',
      author: 'laboratorio',
    }
    const { status, review } = reviewSubmission(full)
    const result: LabResult = { wouldBe: status, review }
    return result
  },
}
