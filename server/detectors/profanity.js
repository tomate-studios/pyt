/**
 * DETECTOR ANTIGROSERÍAS (v1 — reglas locales)
 * ============================================
 * Analiza texto en busca de insultos, groserías, obscenidades,
 * acoso verbal y ataques personales.
 *
 * Principios:
 * - Coincidencia por PALABRA COMPLETA (límites de palabra), nunca por
 *   subcadena. Así, palabras científicas legítimas como «artículo»,
 *   «computadora», «análisis» o «sexto» NO se bloquean por contener
 *   accidentalmente una secuencia similar a una grosería.
 * - Severidad ALTA  -> rechazo claro.
 * - Severidad MEDIA -> palabra ambigua o vulgarismo leve: se pide
 *   revisión adicional en lugar de rechazar automáticamente.
 * - Formas ofuscadas (l33t, letras separadas) se detectan aparte y se
 *   tratan como ambiguas -> revisión, para no castigar falsos positivos.
 *
 * Limitación declarada: es un sistema local por reglas. No entiende
 * ironía ni contexto profundo; ante la duda, marca para revisión humana.
 */

// --- Normalización ---------------------------------------------------------

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalize(text) {
  return stripAccents(String(text).toLowerCase())
}

// Variante "desofuscada": sustituye l33t común y elimina separadores
// entre letras sueltas ("p u t a" -> "puta"). Solo se usa para detectar
// intentos de evasión; los resultados se tratan como ambiguos.
function deobfuscate(text) {
  let t = normalize(text)
  t = t
    .replace(/4|@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1|!|\|/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5|\$/g, 's')
    .replace(/7/g, 't')
  // Une letras separadas por espacios o puntos: "p u t a", "p.u.t.a"
  t = t.replace(/\b(?:[a-z][\s.]+){2,}[a-z]\b/g, (m) => m.replace(/[\s.]+/g, ''))
  return t
}

// --- Listas ----------------------------------------------------------------

// Obscenidades e insultos claros -> rechazo (severidad alta)
const HIGH = [
  // Español — obscenidades
  'mierda', 'coño', 'carajo', 'verga', 'follar', 'joder', 'cojones',
  'mamada', 'chingar', 'pija', 'polla',
  // Español — insultos / ataques personales
  'puta', 'puto', 'zorra', 'cabron', 'cabrona', 'pendejo', 'pendeja',
  'gilipollas', 'imbecil', 'subnormal', 'retrasado', 'retrasada',
  'idiota', 'maricon', 'hijoputa', 'malparido', 'malparida',
  // Inglés — comunes
  'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'cunt', 'dick',
  'bastard', 'whore', 'slut', 'retard', 'moron', 'nigger', 'faggot',
]

// Frases de acoso / ataque directo -> rechazo
const HIGH_PHRASES = [
  'hijo de puta', 'hija de puta', 'vete a la mierda', 'que te den',
  'me cago en', 'anda a la mierda', 'cierra el pico', 'callate la boca',
]

// Vulgarismos o palabras ambiguas -> revisión, no rechazo automático
const MEDIUM = [
  'culo', 'cagar', 'pedo', 'pis', 'boludo', 'boluda', 'pelotudo',
  'pelotuda', 'gil', 'estupido', 'estupida', 'tonto', 'tonta', 'burro',
  'burra', 'payaso', 'payasa', 'inutil', 'cretino', 'cretina',
  'damn', 'crap', 'dumb', 'stupid',
]

// Palabras legítimas frecuentes en texto científico que contienen
// secuencias parecidas a groserías. Con la coincidencia por palabra
// completa ya están protegidas; esta lista se expone en el resultado
// como documentación de falsos positivos evitados.
export const PROTECTED_WORDS = [
  'artículo', 'computadora', 'análisis', 'sexto', 'cálculo', 'espectro',
  'penetración', 'reputación', 'imputar', 'Scunthorpe',
]

function wordRegex(word) {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Plural opcional: detecta también «imbéciles», «idiotas», etc.
  return new RegExp(`(?<![a-z])${esc}(?:es|s)?(?![a-z])`, 'g')
}

function findMatches(text, words, severity, category) {
  const found = []
  for (const w of words) {
    const re = wordRegex(w)
    let m
    while ((m = re.exec(text)) !== null) {
      const start = Math.max(0, m.index - 30)
      const end = Math.min(text.length, m.index + m[0].length + 30)
      found.push({
        fragment: m[0],
        context: text.slice(start, end).trim(),
        severity,
        category,
      })
    }
  }
  return found
}

/**
 * Analiza un texto (título, resumen, explicación o comentario).
 * @param {string} rawText
 * @returns resultado estructurado del detector
 */
export function detectProfanity(rawText) {
  const text = normalize(rawText)
  const obf = deobfuscate(rawText)

  const matches = [
    ...findMatches(text, HIGH, 'high', 'obscenidad o insulto'),
    ...findMatches(text, HIGH_PHRASES, 'high', 'acoso o ataque personal'),
    ...findMatches(text, MEDIUM, 'medium', 'vulgarismo o palabra ambigua'),
  ]

  // Detección de formas ofuscadas: solo si no había coincidencia directa.
  if (matches.length === 0 && obf !== text) {
    const obfMatches = [
      ...findMatches(obf, HIGH, 'medium', 'posible grosería ofuscada'),
      ...findMatches(obf, HIGH_PHRASES, 'medium', 'posible acoso ofuscado'),
    ]
    matches.push(...obfMatches)
  }

  // Deduplicar por fragmento+severidad
  const seen = new Set()
  const unique = matches.filter((m) => {
    const k = `${m.fragment}|${m.severity}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const hasHigh = unique.some((m) => m.severity === 'high')
  const hasMedium = unique.some((m) => m.severity === 'medium')

  let verdict, explanation, suggestion
  if (hasHigh) {
    verdict = 'rejected'
    explanation =
      'Se detectaron insultos, groserías o expresiones ofensivas claras. P.Y.T. es una comunidad científica: el debate debe ser respetuoso.'
    suggestion =
      'Reformula el texto eliminando las expresiones señaladas. Puedes criticar ideas con firmeza sin atacar a las personas.'
  } else if (hasMedium) {
    verdict = 'review'
    explanation =
      'Se detectaron palabras potencialmente ofensivas o ambiguas. Para no bloquear texto legítimo por error, esta publicación queda pendiente de revisión adicional.'
    suggestion =
      'Revisa las palabras señaladas: si las usaste en sentido ofensivo, reformúlalas; si es un uso legítimo, un revisor lo confirmará.'
  } else {
    verdict = 'clean'
    explanation = 'No se detectaron insultos, groserías ni ataques personales.'
    suggestion = null
  }

  return {
    detector: 'antigroserias-local-v1',
    verdict, // 'clean' | 'review' | 'rejected'
    matches: unique,
    explanation,
    suggestion,
    confidence: hasHigh ? 'alta' : hasMedium ? 'media' : 'alta',
    limitations:
      'Detector local por reglas con coincidencia de palabra completa. No interpreta ironía ni contexto profundo; las palabras ambiguas se envían a revisión en lugar de rechazarse automáticamente.',
  }
}
