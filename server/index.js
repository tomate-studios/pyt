/**
 * P.Y.T. — Backend (Express + SQLite real)
 * ========================================
 * Un único proceso sirve la API y el frontend:
 *   - Desarrollo: Vite en modo middleware (HMR incluido) — `npm run dev`
 *   - Producción: sirve `dist/` generado con `npm run build` — `npm start`
 *
 * Seguridad aplicada:
 *   - Validación y límites de longitud en el servidor.
 *   - Consultas parametrizadas (sin SQL concatenado).
 *   - El texto se almacena crudo y el frontend lo renderiza como texto
 *     (React escapa por defecto: no hay HTML inyectable).
 *   - Límite de tamaño del body y rate-limiting sencillo en escrituras.
 *   - Propiedad de borradores mediante token de cliente (cabecera
 *     `x-client-token`): nadie puede editar publicaciones ajenas.
 */
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, CATEGORIES } from './db.js'
import { reviewSubmission, reviewComment } from './review.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// --- Argumentos CLI: --port N / --host [H] (compatibles con `npm run dev --`)
function parseArgs(argv) {
  let port = Number(process.env.PORT) || 7100
  let host = process.env.HOST || '0.0.0.0'
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--port' && argv[i + 1]) port = Number(argv[++i])
    else if (a.startsWith('--port=')) port = Number(a.slice(7))
    else if (a === '--host') {
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) host = argv[++i]
      else host = '0.0.0.0'
    } else if (a.startsWith('--host=')) host = a.slice(7)
  }
  return { port, host }
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

// --- Rate limiting sencillo para escrituras (por IP) -----------------------
const buckets = new Map()
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    const b = buckets.get(key) || { count: 0, reset: now + windowMs }
    if (now > b.reset) {
      b.count = 0
      b.reset = now + windowMs
    }
    b.count += 1
    buckets.set(key, b)
    if (b.count > max) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.' })
    }
    next()
  }
}
const writeLimit = rateLimit(30, 60_000)

// --- Utilidades -------------------------------------------------------------
const TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/
function clientToken(req) {
  const t = req.get('x-client-token') || ''
  return TOKEN_RE.test(t) ? t : null
}

const LIMITS = {
  title: { min: 5, max: 140 },
  summary: { min: 20, max: 500 },
  content: { min: 100, max: 20000 },
  sources: { min: 0, max: 3000 },
  author: { min: 2, max: 40 },
  comment: { min: 2, max: 1500 },
}

function validateTheory(body) {
  const errors = []
  const clean = {}
  for (const field of ['title', 'summary', 'content', 'sources', 'author']) {
    const v = String(body[field] ?? '').trim()
    clean[field] = v
    const lim = LIMITS[field]
    if (v.length < lim.min) errors.push(`El campo «${field}» debe tener al menos ${lim.min} caracteres.`)
    if (v.length > lim.max) errors.push(`El campo «${field}» no puede superar ${lim.max} caracteres.`)
  }
  clean.category = String(body.category ?? '')
  if (!CATEGORIES.includes(clean.category)) errors.push('Categoría no válida.')
  return { errors, clean }
}

function publicTheory(row, token) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    content: row.content,
    sources: row.sources,
    author: row.author,
    status: row.status,
    review: row.review_json ? JSON.parse(row.review_json) : null,
    isExample: !!row.is_example,
    likes: row.likes_count,
    likedByMe: token
      ? !!db.prepare('SELECT 1 FROM likes WHERE theory_id = ? AND client_token = ?').get(row.id, token)
      : false,
    mine: token ? row.client_token === token : false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// --- API --------------------------------------------------------------------

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'P.Y.T.', version: 'v1' }))

app.get('/api/categories', (_req, res) => res.json({ categories: CATEGORIES }))

// Lista de publicaciones APROBADAS (nada pendiente ni rechazado es público)
app.get('/api/theories', (req, res) => {
  const token = clientToken(req)
  const search = String(req.query.search ?? '').trim().slice(0, 120)
  const category = String(req.query.category ?? '').trim()
  const sort = req.query.sort === 'popular' ? 'popular' : 'recent'

  const where = ["status = 'published'"]
  const params = []
  if (category && CATEGORIES.includes(category)) {
    where.push('category = ?')
    params.push(category)
  }
  if (search) {
    where.push('(title LIKE ? OR summary LIKE ? OR content LIKE ? OR author LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like, like)
  }
  const order = sort === 'popular' ? 'likes_count DESC, created_at DESC' : 'created_at DESC'
  const rows = db
    .prepare(`SELECT * FROM theories WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 200`)
    .all(...params)
  res.json({ theories: rows.map((r) => publicTheory(r, token)) })
})

// Detalle (publicadas; el propietario puede ver las suyas en cualquier estado)
app.get('/api/theories/:id', (req, res) => {
  const token = clientToken(req)
  const row = db.prepare('SELECT * FROM theories WHERE id = ?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'Publicación no encontrada.' })
  if (row.status !== 'published' && row.client_token !== token) {
    return res.status(403).json({ error: 'Esta publicación no es pública.' })
  }
  const comments = db
    .prepare('SELECT id, author, content, created_at AS createdAt FROM comments WHERE theory_id = ? ORDER BY created_at ASC LIMIT 200')
    .all(row.id)
  res.json({ theory: publicTheory(row, token), comments })
})

// Enviar una teoría para revisión (pasos 2→5)
app.post('/api/theories', writeLimit, (req, res) => {
  const token = clientToken(req)
  if (!token) return res.status(401).json({ error: 'Falta el token de cliente.' })
  const { errors, clean } = validateTheory(req.body || {})
  if (errors.length) return res.status(400).json({ error: 'Validación fallida.', details: errors })

  const { status, review } = reviewSubmission(clean)
  const info = db
    .prepare(
      `INSERT INTO theories (title, category, summary, content, sources, author, status, review_json, client_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(clean.title, clean.category, clean.summary, clean.content, clean.sources, clean.author, status, JSON.stringify(review), token)

  const row = db.prepare('SELECT * FROM theories WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ theory: publicTheory(row, token) })
})

// Mis publicaciones (borradores, pendientes, rechazadas y publicadas propias)
app.get('/api/mine', (req, res) => {
  const token = clientToken(req)
  if (!token) return res.status(401).json({ error: 'Falta el token de cliente.' })
  const rows = db
    .prepare('SELECT * FROM theories WHERE client_token = ? AND is_example = 0 ORDER BY updated_at DESC LIMIT 100')
    .all(token)
  res.json({ theories: rows.map((r) => publicTheory(r, token)) })
})

// Editar y volver a enviar (solo el autor; nunca contenido ajeno)
app.put('/api/theories/:id', writeLimit, (req, res) => {
  const token = clientToken(req)
  if (!token) return res.status(401).json({ error: 'Falta el token de cliente.' })
  const row = db.prepare('SELECT * FROM theories WHERE id = ?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'Publicación no encontrada.' })
  if (row.client_token !== token || row.is_example) {
    return res.status(403).json({ error: 'No puedes modificar publicaciones ajenas.' })
  }
  if (row.status === 'published') {
    return res.status(409).json({ error: 'Las publicaciones ya aprobadas no se editan en esta versión.' })
  }
  const { errors, clean } = validateTheory(req.body || {})
  if (errors.length) return res.status(400).json({ error: 'Validación fallida.', details: errors })

  const { status, review } = reviewSubmission(clean)
  db.prepare(
    `UPDATE theories SET title=?, category=?, summary=?, content=?, sources=?, author=?, status=?, review_json=?, updated_at=datetime('now')
     WHERE id=?`,
  ).run(clean.title, clean.category, clean.summary, clean.content, clean.sources, clean.author, status, JSON.stringify(review), row.id)

  const updated = db.prepare('SELECT * FROM theories WHERE id = ?').get(row.id)
  res.json({ theory: publicTheory(updated, token) })
})

// Me gusta (alternar; persistido; uno por cliente)
app.post('/api/theories/:id/like', writeLimit, (req, res) => {
  const token = clientToken(req)
  if (!token) return res.status(401).json({ error: 'Falta el token de cliente.' })
  const row = db.prepare("SELECT * FROM theories WHERE id = ? AND status = 'published'").get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'Publicación no encontrada.' })
  const existing = db.prepare('SELECT 1 FROM likes WHERE theory_id = ? AND client_token = ?').get(row.id, token)
  let liked
  if (existing) {
    db.prepare('DELETE FROM likes WHERE theory_id = ? AND client_token = ?').run(row.id, token)
    liked = false
  } else {
    db.prepare('INSERT INTO likes (theory_id, client_token) VALUES (?, ?)').run(row.id, token)
    liked = true
  }
  const real = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE theory_id = ?').get(row.id).n
  // likes_count = base sembrada (ejemplos editoriales) + likes reales
  db.prepare('UPDATE theories SET likes_count = ? WHERE id = ?').run(row.base_likes + real, row.id)
  const fresh = db.prepare('SELECT likes_count FROM theories WHERE id = ?').get(row.id)
  res.json({ liked, likes: fresh.likes_count })
})

// Comentarios (moderados por el detector antigroserías antes de publicarse)
app.post('/api/theories/:id/comments', writeLimit, (req, res) => {
  const token = clientToken(req)
  if (!token) return res.status(401).json({ error: 'Falta el token de cliente.' })
  const row = db.prepare("SELECT * FROM theories WHERE id = ? AND status = 'published'").get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'Publicación no encontrada.' })
  const author = String(req.body?.author ?? '').trim()
  const content = String(req.body?.content ?? '').trim()
  if (author.length < 2 || author.length > LIMITS.author.max)
    return res.status(400).json({ error: 'El nombre debe tener entre 2 y 40 caracteres.' })
  if (content.length < LIMITS.comment.min || content.length > LIMITS.comment.max)
    return res.status(400).json({ error: `El comentario debe tener entre 2 y ${LIMITS.comment.max} caracteres.` })

  const check = reviewComment(`${author}\n${content}`)
  if (check.verdict === 'rejected') {
    return res.status(422).json({
      error: 'Comentario rechazado por el detector antigroserías.',
      review: check,
    })
  }
  const info = db.prepare('INSERT INTO comments (theory_id, author, content) VALUES (?, ?, ?)').run(row.id, author, content)
  const comment = db.prepare('SELECT id, author, content, created_at AS createdAt FROM comments WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ comment, moderation: check.verdict === 'review' ? check : null })
})

// Laboratorio de pruebas: ejecuta ambos detectores SIN guardar nada
app.post('/api/lab/test', writeLimit, (req, res) => {
  const fields = {
    title: String(req.body?.title ?? '').slice(0, 500),
    summary: String(req.body?.summary ?? '').slice(0, 1000),
    content: String(req.body?.content ?? '').slice(0, 25000),
    sources: String(req.body?.sources ?? '').slice(0, 4000),
  }
  if (!fields.content.trim()) return res.status(400).json({ error: 'Escribe un texto para analizar.' })
  const { status, review } = reviewSubmission(fields)
  res.json({ wouldBe: status, review })
})

// --- Frontend: Vite (dev) o estáticos (prod) --------------------------------
const { port, host } = parseArgs(process.argv)
const distDir = path.join(rootDir, 'dist')
const prod = process.argv.includes('--prod') || process.env.NODE_ENV === 'production'

if (prod) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
  app.listen(port, host, () => {
    console.log(`P.Y.T. (producción) en http://${host}:${port}`)
  })
} else {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'spa',
    logLevel: 'warn',
  })
  app.use(vite.middlewares)
  app.listen(port, host, () => {
    console.log(`P.Y.T. (desarrollo) en http://${host}:${port}`)
  })
}
