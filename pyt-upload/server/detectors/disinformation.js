/**
 * DETECTOR DE ANTIDESINFORMACIÓN CIENTÍFICA (v1 — reglas locales)
 * ================================================================
 * Identifica afirmaciones científicas potencialmente engañosas sobre el
 * universo real, SIN castigar las hipótesis originales.
 *
 * Reglas fundamentales implementadas:
 * A. Una hipótesis NO es automáticamente desinformación: el lenguaje
 *    epistémico honesto («hipótesis», «propongo», «podría») reduce el
 *    riesgo y nunca es motivo de rechazo por sí solo.
 * B. Se distingue entre hecho respaldado, hipótesis, modelo teórico,
 *    especulación razonada, afirmación dudosa y desinformación
 *    (campo `classification`).
 * C. No se confunden errores con ideas nuevas: contradecir una teoría
 *    aceptada no rechaza nada por sí solo; solo se rechaza cuando se
 *    contradice EVIDENCIA sólida presentándola como hecho, o cuando se
 *    fabrican datos/fuentes.
 * D. No se inventan comprobaciones: este detector NO consulta fuentes
 *    externas y lo declara explícitamente en `sourcesConsulted` y
 *    `limitations`. Lo que no puede verificarse localmente se marca
 *    como «no verificable» y, si hay duda razonable, va a revisión.
 * E. Comprobación real: la arquitectura deja un punto de extensión
 *    (ver `externalVerifier`) para conectar una API de IA o fuentes
 *    científicas en el futuro. En esta v1 no está configurada.
 *
 * Resultado estructurado: verdict, classification, flaggedClaims[],
 * reasons[], confidence, sourcesConsulted, limitations.
 */

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}
const norm = (s) => stripAccents(String(s || '').toLowerCase())

// --- 1. Afirmaciones demostrablemente falsas sobre el universo real --------
// Cada entrada: patrón, corrección y referencia al conocimiento establecido.
const KNOWN_FALSE = [
  {
    pattern: /la tierra es plana|tierra plana/,
    claim: '«La Tierra es plana»',
    correction:
      'La Tierra es un esferoide achatado en los polos: lo confirman siglos de mediciones geodésicas, la navegación, los eclipses y la observación directa desde el espacio.',
    established: 'Geodesia y observación astronómica directa',
  },
  {
    pattern: /el sol gira alrededor de la tierra|la tierra es el centro del universo|la tierra es el centro del sistema solar/,
    claim: '«El Sol gira alrededor de la Tierra / la Tierra es el centro del universo»',
    correction:
      'El modelo heliocéntrico y las paralajes estelares muestran que la Tierra orbita el Sol, y el universo observable no tiene centro privilegiado.',
    established: 'Astronomía de posición y cosmología observacional',
  },
  {
    pattern: /la gravedad no existe|no existe la gravedad|la gravedad es un invento/,
    claim: '«La gravedad no existe / es un invento»',
    correction:
      'La gravedad está medida con enorme precisión: caída de cuerpos, órbitas, lentes gravitacionales, ondas gravitacionales (LIGO/Virgo) y el desplazamiento al rojo gravitacional.',
    established: 'Física experimental y relatividad general verificada',
  },
  {
    pattern: /alunizaje (fue|es) fals|nunca (llegamos|llego el hombre|se llego) a la luna|el viaje a la luna (fue|es) fals/,
    claim: '«El alunizaje fue falso / nunca llegamos a la Luna»',
    correction:
      'Las misiones Apolo dejaron retrorreflectores que aún se usan con láseres desde la Tierra, trajeron 382 kg de rocas lunares analizadas por laboratorios de todo el mundo y fueron rastreadas por países rivales.',
    established: 'Evidencia material, telemetría independiente y mediciones láser lunares',
  },
  {
    pattern: /el universo tiene (6000|6\.000|seis mil) anos/,
    claim: '«El universo tiene 6 000 años»',
    correction:
      'La edad del universo medida por el fondo cósmico de microondas, la expansión de Hubble y la nucleosíntesis es de ~13 800 millones de años (Planck, 2018).',
    established: 'Cosmología observacional (CMB, Hubble-Lemaître)',
  },
  {
    pattern: /los agujeros negros no existen/,
    claim: '«Los agujeros negros no existen»',
    correction:
      'Hay evidencia directa: la imagen del horizonte de sucesos de M87* y Sgr A* (Event Horizon Telescope), las ondas gravitacionales de fusiones (LIGO/Virgo) y las órbitas estelares en el centro galáctico (Nobel 2020).',
    established: 'EHT, LIGO/Virgo y astrometría del centro galáctico',
  },
  {
    pattern: /la relatividad (esta|ha sido|fue) (totalmente |completamente )?(refutada|probada falsa|demostrada falsa)/,
    claim: '«La relatividad está refutada / demostrada falsa»',
    correction:
      'La relatividad especial y general superan cada prueba experimental a la que se las somete (GPS, lentes gravitacionales, precesión de Mercurio, ondas gravitacionales). Cuestionarla es legítimo; afirmar su refutación como hecho consumado, sin evidencia, es falso.',
    established: 'Un siglo de tests experimentales de relatividad',
  },
]

// Contextos que anulan la alarma: la afirmación falsa se menciona para
// negarla, citarla o refutarla, no para sostenerla.
const EXCUSE_CONTEXT =
  /(no es cierto que|es falso que|nieg\w+|refut\w+|desmient\w+|algunos creen (erroneamente )?que|hay quienes? (dicen|creen) que|error de pensar que|mito de que|leyenda urbana)/

// --- 2. Señales de fabricación de datos, fuentes o descubrimientos ---------
const FABRICATION = [
  {
    pattern: /\b\d{1,3}([.,]\d+)? ?% de los cientificos/,
    reason: 'Estadística sobre «los científicos» sin fuente verificable: patrón típico de dato fabricado.',
  },
  {
    pattern: /cientificos de [a-z]+ (demuestran|confirman|descubren|prueban)/,
    reason: 'Atribución de un descubrimiento a «científicos de …» sin referencia concreta: posible fuente inventada.',
  },
  {
    pattern: /estudio secreto|documentos filtrados|expedientes secretos/,
    reason: 'Apelación a estudios o documentos secretos no verificables.',
  },
  {
    pattern: /la nasa (oculta|esconde|miente|encubre)|nos ocultan|la ciencia oficial (oculta|miente)|encubrimiento (mundial|global|cientifico)/,
    reason: 'Marco conspirativo: afirma un encubrimiento sin aportar evidencia verificable.',
  },
  {
    pattern: /lo que (los cientificos|la nasa|los gobiernos) no quieren que sepas/,
    reason: 'Fórmula sensacionalista de «verdad oculta», incompatible con la comunicación científica verificable.',
  },
]

// --- 3. Marcadores de afirmación categórica (lenguaje de hecho) ------------
const FACT_CLAIM =
  /esta demostrado( que)?|es un hecho( que)?|hecho probado|la ciencia (lo )?confirma|se ha probado( que)?|100 ?% (seguro|cierto|demostrado)|todos los cientificos (estan de acuerdo|lo saben|aceptan)|indiscutible|incuestionable/g

// --- 4. Marcadores de honestidad epistémica (hipótesis / modelo) -----------
const HYPOTHESIS_MARKERS =
  /hipotesis|propongo|mi teoria|especul\w+|podria|posiblemente|sugiero|quiza(s)?|todavia no (esta|ha sido) demostrado|aun no (esta|ha sido) (probado|demostrado)|sin evidencia (experimental|suficiente)|no esta probado|modelo (teorico|especulativo)|si mi razonamiento es correcto|cabria la posibilidad/g

// Punto de extensión (regla E): en el futuro, una API de IA o un cliente
// de fuentes científicas puede enchufarse aquí. En v1 es null y el
// detector lo declara honestamente.
export const externalVerifier = null

function findIn(text, regex, limit = 10) {
  const out = []
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g')
  let m
  while ((m = re.exec(text)) !== null && out.length < limit) out.push(m[0])
  return out
}

function hasRealSources(sources) {
  const s = String(sources || '')
  return /(https?:\/\/|doi\.org\/|arXiv|ISBN)/i.test(s)
}

/**
 * Evalúa una publicación { title, summary, content, sources }.
 * Devuelve el resultado estructurado del detector.
 */
export function detectDisinformation({ title = '', summary = '', content = '', sources = '' }) {
  const full = `${title}\n${summary}\n${content}`
  const t = norm(full)
  const flaggedClaims = []
  const reasons = []
  let risk = 0

  // 1) Afirmaciones demostrablemente falsas presentadas como propias
  for (const kf of KNOWN_FALSE) {
    const m = t.match(kf.pattern)
    if (m) {
      const before = t.slice(Math.max(0, m.index - 80), m.index)
      if (EXCUSE_CONTEXT.test(before)) continue // se menciona para refutarla
      risk += 5
      flaggedClaims.push({
        fragment: m[0],
        type: 'afirmación falsa presentada como válida',
        reason: `${kf.claim} contradice evidencia científica sólida. ${kf.correction}`,
        established: kf.established,
      })
    }
  }

  // 2) Fabricación de datos, fuentes o descubrimientos
  const sourced = hasRealSources(sources)
  for (const fab of FABRICATION) {
    const m = t.match(fab.pattern)
    if (m) {
      // Si hay fuentes reales, la atribución genérica es menos grave pero se anota
      const weight = sourced ? 1 : 2
      risk += weight
      flaggedClaims.push({
        fragment: m[0],
        type: 'posible fabricación o fuente no verificable',
        reason: fab.reason + (sourced ? ' (Se aportan fuentes; verificar que respalden la afirmación.)' : ''),
      })
    }
  }

  // 3) Lenguaje categórico
  const factClaims = findIn(t, FACT_CLAIM, 5)
  if (factClaims.length > 0) {
    risk += Math.min(factClaims.length, 3)
    if (factClaims.length >= 2 || flaggedClaims.length > 0) {
      reasons.push(
        `Lenguaje de hecho consumado («${factClaims.slice(0, 2).join('», «')}») sin distinción entre hechos, hipótesis y especulación.`,
      )
    }
  }

  // 4) Honestidad epistémica: reduce el riesgo, nunca lo aumenta (regla A)
  const hedges = findIn(t, HYPOTHESIS_MARKERS, 10)
  risk -= Math.min(hedges.length, 3)
  if (sourced) risk -= 1

  // 5) Evaluabilidad: contenido demasiado breve no permite concluir (regla D)
  const wordCount = t.split(/\s+/).filter(Boolean).length
  let notVerifiable = false
  if (wordCount < 40) {
    risk += 1
    notVerifiable = true
    reasons.push(
      'El texto es demasiado breve para evaluar sus afirmaciones; el detector no dispone de pruebas suficientes y lo reconoce en lugar de inventar una comprobación.',
    )
  }

  // --- Veredicto ---
  let verdict, classification
  if (risk >= 5) {
    verdict = 'rejected'
    classification = 'Desinformación probable'
  } else if (risk >= 2) {
    verdict = 'review'
    classification = hedges.length > 0 ? 'Especulación razonada (requiere revisión)' : 'Afirmación dudosa'
  } else {
    verdict = 'approved'
    if (hedges.length >= 2) classification = 'Hipótesis científica / especulación razonada'
    else if (sourced && factClaims.length > 0) classification = 'Hecho respaldado por fuentes (verificación local limitada)'
    else if (hedges.length > 0) classification = 'Hipótesis o modelo teórico'
    else classification = 'Texto divulgativo sin señales de riesgo'
  }

  if (flaggedClaims.length > 0 && reasons.length === 0) {
    reasons.push('Se encontraron afirmaciones que requieren revisión; ver el detalle por fragmento.')
  }
  if (verdict === 'approved' && reasons.length === 0) {
    reasons.push(
      hedges.length > 0
        ? 'El texto presenta sus ideas como hipótesis o especulación, no como hechos demostrados. Una hipótesis sin demostrar no es desinformación.'
        : 'No se detectaron afirmaciones falsas conocidas, datos fabricados ni lenguaje engañoso.',
    )
  }

  return {
    detector: 'antidesinformacion-local-v1',
    verdict, // 'approved' | 'review' | 'rejected'
    classification,
    riskScore: risk,
    flaggedClaims,
    reasons,
    confidence: verdict === 'approved' ? 'media' : verdict === 'review' ? 'baja' : 'media',
    sourcesConsulted: [], // Regla D: no se fingen consultas
    notVerifiable,
    limitations:
      'Evaluación heurística LOCAL por reglas (v1). No se consultaron fuentes externas ni bases de datos científicas; las correcciones mostradas proceden de conocimiento científico bien establecido incorporado en las reglas. Las afirmaciones novedosas sobre datos experimentales NO pueden verificarse con este sistema: ante la duda, la publicación queda pendiente de revisión humana en lugar de rechazarse. El resultado no es una garantía de verdad científica.',
    suggestion:
      verdict === 'rejected'
        ? 'Elimina o reformula las afirmaciones señaladas: preséntalas como hipótesis («propongo la hipótesis de que…»), aporta argumentos y fuentes reales, y evita afirmar como hecho lo que la evidencia establecida contradice.'
        : verdict === 'review'
          ? 'Añade fuentes verificables, distingue explícitamente hechos de hipótesis y amplía la argumentación para facilitar la revisión.'
          : null,
  }
}
