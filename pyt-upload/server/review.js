/**
 * PIPELINE DE REVISIÓN — combina los dos detectores independientes.
 *
 * Flujo (exactamente el especificado):
 *   Paso 3: detector de antidesinformación
 *   Paso 4: detector de antigroserías
 *   Paso 5: combinación de resultados
 *
 * - Desinformación clara  -> rechazada
 * - Groserías claras      -> rechazada
 * - Ambos aprueban        -> publicada
 * - Cualquiera no concluye -> pendiente de revisión (no se publica)
 */
import { detectDisinformation } from './detectors/disinformation.js'
import { detectProfanity } from './detectors/profanity.js'

export function reviewSubmission(fields) {
  const disinformation = detectDisinformation(fields)
  const profanityText = [fields.title, fields.summary, fields.content, fields.sources]
    .filter(Boolean)
    .join('\n')
  const profanity = detectProfanity(profanityText)

  let status
  if (disinformation.verdict === 'rejected' || profanity.verdict === 'rejected') {
    status = 'rejected'
  } else if (disinformation.verdict === 'review' || profanity.verdict === 'review') {
    status = 'pending'
  } else {
    status = 'published'
  }

  return {
    status,
    review: {
      pipelineVersion: 'reglas-locales-v1',
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

/** Revisión solo de comentarios: aplica el detector antigroserías. */
export function reviewComment(text) {
  return detectProfanity(text)
}
