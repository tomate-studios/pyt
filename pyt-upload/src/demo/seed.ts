import type { Theory } from '../types'

/**
 * Contenido editorial de ejemplo para la versión demo estática.
 * Es el MISMO contenido que siembra el backend (server/db.js), duplicado
 * aquí porque la demo no tiene base de datos. Si se edita uno, editar ambos.
 */

export const CATEGORIES = [
  'Cosmología',
  'Gravedad',
  'Agujeros negros',
  'Relatividad',
  'Mecánica cuántica',
  'Materia y energía',
  'Galaxias',
  'Otras hipótesis',
]

const now = () => new Date().toISOString()

function editorial(
  id: number,
  title: string,
  category: string,
  summary: string,
  content: string,
  sources: string,
  likes: number,
): Theory {
  return {
    id,
    title,
    category,
    summary,
    content,
    sources,
    author: 'Equipo P.Y.T. (contenido editorial)',
    status: 'published',
    review: null,
    isExample: true,
    likes,
    likedByMe: false,
    mine: false,
    createdAt: now(),
    updatedAt: now(),
  }
}

export function seedTheories(): Theory[] {
  return [
    editorial(
      1,
      'Hipótesis: la gravedad como fenómeno emergente de la entropía del espacio-tiempo',
      'Gravedad',
      'Propongo explorar la idea de que la gravedad no sea una fuerza fundamental, sino un fenómeno emergente vinculado a la entropía asociada a los horizontes. Es una hipótesis especulativa inspirada en trabajos previos, no un hecho demostrado.',
      'Propongo la hipótesis de que la gravedad podría no ser una interacción fundamental, sino un fenómeno emergente relacionado con la entropía de la información del espacio-tiempo.\n\nLa idea no es mía en origen: Verlinde (2011) propuso la «gravedad entrópica», derivando la ley de Newton a partir del principio holográfico y la termodinámica de horizontes. Mi aportación especulativa es preguntarme si las desviaciones atribuidas a la materia oscura podrían reinterpretarse, al menos en parte, como correcciones entrópicas en regímenes de baja aceleración.\n\nQuiero ser claro: esto es una hipótesis sin evidencia experimental directa que la respalde en su forma actual. Las simulaciones de dinámica galáctica y los datos de lentes gravitacionales parecen favorecer la materia oscura partícula frente a versiones simples de gravedad emergente. Presento esta idea como especulación razonada, abierta a crítica y refutación, no como un hecho.',
      'Verlinde, E. (2011). "On the Origin of Gravity and the Laws of Newton". arXiv:1001.0785\nBekenstein, J. (1973). "Black holes and entropy". Physical Review D.',
      14,
    ),
    editorial(
      2,
      'Los agujeros negros como procesadores de información: qué dice realmente la evidencia',
      'Agujeros negros',
      'Revisión divulgativa de las evidencias observacionales de los agujeros negros (EHT, LIGO/Virgo, órbitas estelares) y del problema de la paradoja de la información, distinguiendo hechos confirmados de cuestiones abiertas.',
      'Los agujeros negros pasaron de ser una predicción teórica a objetos observados con evidencia directa. Conviene distinguir lo confirmado de lo abierto.\n\nHechos respaldados por observación: (1) la imagen del horizonte de sucesos de M87* (2019) y de Sgr A* (2022) por el Event Horizon Telescope; (2) las ondas gravitacionales de fusiones de agujeros negros detectadas por LIGO/Virgo desde 2015; (3) las órbitas de estrellas como S2 alrededor del centro galáctico, que implican una masa de ~4 millones de soles en un volumen compacto (Nobel de Física 2020, Genzel y Ghez).\n\nCuestión abierta: la paradoja de la información. Hawking mostró que los agujeros negros evaporan radiación térmica, lo que parece destruir información y contradice la unitariedad cuántica. Propuestas como el principio holográfico, los «firewalls» o las islas de entropía son modelos teóricos en debate, no hechos establecidos.\n\nConclusión: la existencia de los agujeros negros es un hecho observacional; el destino de la información en ellos sigue siendo una de las grandes preguntas abiertas de la física.',
      'Event Horizon Telescope Collaboration (2019). ApJ 875:L1.\nAbbott et al. (LIGO/Virgo) (2016). PRL 116, 061102.\nHawking, S. (1976). "Breakdown of predictability in gravitational collapse". PRD 14.',
      27,
    ),
    editorial(
      3,
      'Materia oscura: por qué las curvas de rotación de las galaxias siguen siendo un problema',
      'Galaxias',
      'Las estrellas en los bordes de las galaxias giran más rápido de lo que predice la materia visible. Repaso las evidencias de la materia oscura y las alternativas propuestas, sin dar por cerrado un debate que sigue abierto.',
      'Vera Rubin y sus colaboradores midieron en los años 70 las curvas de rotación de galaxias espirales: las estrellas externas orbitan a velocidades casi constantes en lugar de decrecer como predice la ley de Kepler para la materia visible.\n\nLa interpretación dominante es la existencia de un halo de materia oscura que no emite luz pero aporta gravedad. Otras evidencias independientes apuntan en la misma dirección: lentes gravitacionales, la estructura a gran escala del universo, el fondo cósmico de microondas (Planck) y el cúmulo Bala, donde la masa deducida por lentes está separada del gas caliente.\n\nAlternativas propuestas: gravedades modificadas (MOND y sus extensiones relativistas como TeVeS). Hasta donde llegan los datos actuales, MOND describe bien las curvas de rotación individuales pero tiene serias dificultades con el CMB y los cúmulos. A día de hoy no hay detección directa confirmada de partículas de materia oscura (WIMPs, axiones…) pese a décadas de experimentos.\n\nEs legítimo investigar tanto partículas nuevas como gravedades modificadas: el debate sigue abierto y ninguna de las dos vías puede presentarse todavía como cerrada.',
      'Rubin, V. & Ford, W. (1970). ApJ 159, 379.\nPlanck Collaboration (2020). A&A 641, A6.\nClowe et al. (2006). ApJ 648, L109 (cúmulo Bala).',
      19,
    ),
    editorial(
      4,
      'Ondas gravitacionales: qué confirman y qué no confirman las detecciones de LIGO',
      'Relatividad',
      'Las detecciones de ondas gravitacionales confirman predicciones de la relatividad general en régimen fuerte, pero no «prueban» toda la teoría en todos los regímenes. Un repaso honesto a lo que los datos dicen.',
      'El 14 de septiembre de 2015, LIGO detectó GW150914, la señal de la fusión de dos agujeros negros a ~1 300 millones de años luz. Fue la primera observación directa de ondas gravitacionales, predichas por Einstein un siglo antes.\n\nQué confirman estas detecciones: la existencia de ondas gravitacionales, la descripción de agujeros negros binarios de la relatividad general en régimen de campo fuerte con precisión notable, y la velocidad de propagación de la gravedad igual a la de la luz con enorme precisión (GW170817 + contrapartida electromagnética).\n\nQué NO confirman: no validan la relatividad general en todos los regímenes posibles (la unificación con la mecánica cuántica sigue abierta), no excluyen todas las teorías alternativas de gravedad (algunas también predicen ondas similares) y no resuelven la naturaleza de la energía oscura responsable de la expansión acelerada.\n\nLa ciencia avanza contrastando predicciones, no declarando victorias absolutas: la relatividad general es hoy la descripción más exitosa de la gravedad, y seguir poniéndola a prueba es precisamente lo que hacen estos observatorios.',
      'Abbott et al. (LIGO/Virgo) (2016). PRL 116, 061102 (GW150914).\nAbbott et al. (2017). PRL 119, 161101 (GW170817).',
      22,
    ),
  ]
}
