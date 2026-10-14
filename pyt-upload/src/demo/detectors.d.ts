/**
 * Declaraciones de tipos para importar los detectores JS compartidos con el
 * backend (server/detectors/*.js) desde la versión demo estática.
 */
declare module '*disinformation.js' {
  export function detectDisinformation(fields: {
    title?: string
    summary?: string
    content?: string
    sources?: string
  }): import('../types').DisinformationResult
}

declare module '*profanity.js' {
  export function detectProfanity(text: string): import('../types').ProfanityResult
}
