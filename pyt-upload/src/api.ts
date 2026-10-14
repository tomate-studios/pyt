import type { Comment, LabResult, Theory, TheoryInput } from './types'
import { localApi } from './api-local'

export type { TheoryInput } from './types'

/**
 * Token de cliente: identifica al visitante para sus borradores, likes y
 * comentarios. Se genera una vez y se guarda en localStorage. No es una
 * cuenta de usuario (v1 sin autenticación): solo impide que un visitante
 * edite los borradores de otro.
 */
const TOKEN_KEY = 'pyt-client-token'

export function getClientToken(): string {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    localStorage.setItem(TOKEN_KEY, token)
  }
  return token
}

/** true en la compilación estática de GitHub Pages (modo demo, sin backend). */
export const isStaticDemo = import.meta.env.VITE_STATIC === 'true'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-client-token': getClientToken(),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`) as Error & {
      status?: number
      details?: string[]
      payload?: unknown
    }
    err.status = res.status
    err.details = data.details
    err.payload = data
    throw err
  }
  return data as T
}

const remoteApi = {
  categories: () => request<{ categories: string[] }>('/api/categories'),

  listTheories: (params: { search?: string; category?: string; sort?: 'recent' | 'popular' }) => {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.category) q.set('category', params.category)
    if (params.sort) q.set('sort', params.sort)
    return request<{ theories: Theory[] }>(`/api/theories?${q.toString()}`)
  },

  getTheory: (id: number | string) =>
    request<{ theory: Theory; comments: Comment[] }>(`/api/theories/${id}`),

  submitTheory: (input: TheoryInput) =>
    request<{ theory: Theory }>('/api/theories', { method: 'POST', body: JSON.stringify(input) }),

  updateTheory: (id: number, input: TheoryInput) =>
    request<{ theory: Theory }>(`/api/theories/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  mine: () => request<{ theories: Theory[] }>('/api/mine'),

  toggleLike: (id: number) =>
    request<{ liked: boolean; likes: number }>(`/api/theories/${id}/like`, { method: 'POST' }),

  addComment: (id: number, author: string, content: string) =>
    request<{ comment: Comment; moderation: unknown }>(`/api/theories/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author, content }),
    }),

  labTest: (fields: Partial<TheoryInput> & { content: string }) =>
    request<LabResult>('/api/lab/test', { method: 'POST', body: JSON.stringify(fields) }),
}

/**
 * Punto único de acceso a datos de la app. En la versión completa habla con
 * el backend Express + SQLite; en la compilación estática (GitHub Pages) usa
 * la implementación local del navegador con los MISMOS detectores.
 */
export const api = isStaticDemo ? localApi : remoteApi

export function formatDate(iso: string): string {
  // El servidor devuelve UTC "YYYY-MM-DD HH:MM:SS"; la demo usa ISO con 'T'
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}
