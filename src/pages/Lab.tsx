import { useState } from 'react'
import { FlaskConical, Play } from 'lucide-react'
import { api } from '../api'
import type { LabResult } from '../types'
import ReviewPanel from '../components/ReviewPanel'

/**
 * LABORATORIO DE PRUEBAS
 * Ejecuta ambos detectores sobre cualquier texto SIN guardar ni publicar
 * nada. Los 5 ejemplos precargados son ejemplos de prueba: nunca aparecen
 * como publicaciones reales de usuarios.
 */
const EXAMPLES: { name: string; expect: string; fields: { title: string; summary: string; content: string; sources: string } }[] = [
  {
    name: '1 · Hipótesis original identificada como tal',
    expect: 'Debería APROBARSE: es una hipótesis honesta, no desinformación.',
    fields: {
      title: 'Hipótesis sobre la expansión del universo',
      summary: 'Propongo una hipótesis especulativa sobre la expansión acelerada del universo y la energía oscura.',
      content:
        'Propongo la hipótesis, todavía no demostrada, de que la energía oscura podría variar con el tiempo en lugar de ser una constante cosmológica. No está probado; sería compatible con los datos actuales del CMB solo en ciertos rangos. Mi razonamiento es especulativo y podría estar equivocado, pero sugiero que futuros relevamientos como Euclid podrían ponerlo a prueba. No presento esto como un hecho, sino como una posibilidad a investigar con rigor y paciencia metodológica.',
      sources: '',
    },
  },
  {
    name: '2 · Afirmación falsa presentada como hecho',
    expect: 'Debería RECHAZARSE por desinformación clara.',
    fields: {
      title: 'La Tierra es plana, está demostrado',
      summary: 'Está demostrado que la Tierra es plana y la NASA oculta la verdad al mundo entero.',
      content:
        'Es un hecho que la Tierra es plana. La NASA oculta las pruebas y todos los científicos están de acuerdo en encubrirlo. El 97% de los científicos sabe que la gravedad no existe, es un invento para controlarnos. Documentos filtrados lo confirman. Está demostrado al 100%.',
      sources: '',
    },
  },
  {
    name: '3 · Teoría con groserías',
    expect: 'Debería RECHAZARSE por lenguaje ofensivo, aunque la idea sea válida.',
    fields: {
      title: 'Mi teoría sobre agujeros negros',
      summary: 'Una idea sobre agujeros negros y la información que contienen en su interior.',
      content:
        'Los agujeros negros son fascinantes, y quien diga lo contrario es un imbécil y un gilipollas que no entiende nada de física. Propongo que la información se conserva en el horizonte de sucesos, siguiendo el principio holográfico de t Hooft y Susskind. Es solo una hipótesis razonable dentro del debate científico actual sobre la paradoja de la información.',
      sources: '',
    },
  },
  {
    name: '4 · Hipótesis sin pruebas, declarada honestamente',
    expect: 'NO debería confundirse con desinformación: falta de evidencia ≠ engaño.',
    fields: {
      title: '¿Podría haber universos burbuja?',
      summary: 'Especulo sobre la posibilidad de universos burbuja en un multiverso inflacionario.',
      content:
        'Especulo con la posibilidad de que nuestro universo sea una burbuja entre muchas en un escenario de inflación eterna. No tengo evidencia experimental propia ni afirmo que esté demostrado: es una especulación basada en modelos teóricos de inflación cósmica. Quizá nunca podamos comprobarlo, pero cabe la posibilidad de estudiar sus consecuencias en el fondo cósmico de microondas.',
      sources: '',
    },
  },
  {
    name: '5 · Texto científico legítimo con «falsos amigos»',
    expect: 'Debería APROBARSE: «artículo», «computadora», «análisis» o «sexto» no son groserías.',
    fields: {
      title: 'Artículo de análisis espectral de galaxias',
      summary: 'Análisis computacional del espectro de galaxias lejanas usando datos públicos.',
      content:
        'En este artículo presento un análisis del espectro de emisión de galaxias del catálogo SDSS, realizado con una computadora estándar y software libre. El cálculo del desplazamiento al rojo se hizo midiendo líneas de emisión de hidrógeno y oxígeno. El sexto apartado discute la penetración de la radiación ionizante en el medio intergaláctico. Los resultados son consistentes con la expansión del universo descrita por la ley de Hubble-Lemaître.',
      sources: '',
    },
  },
]

const wouldBeLabel: Record<string, { text: string; cls: string }> = {
  published: { text: '✔ Se publicaría', cls: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  pending: { text: '⏳ Quedaría pendiente de revisión (no se publicaría todavía)', cls: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
  rejected: { text: '✘ Se rechazaría', cls: 'border-red-400/30 bg-red-500/10 text-red-300' },
}

export default function Lab() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [sources, setSources] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<LabResult | null>(null)
  const [error, setError] = useState('')

  const loadExample = (i: number) => {
    const f = EXAMPLES[i].fields
    setTitle(f.title)
    setSummary(f.summary)
    setContent(f.content)
    setSources(f.sources)
    setResult(null)
    setError('')
  }

  const run = async () => {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const r = await api.labTest({ title, summary, content, sources })
      setResult(r)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/60 focus:outline-none'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display flex items-center gap-2 text-2xl font-bold text-white">
          <FlaskConical className="h-6 w-6 text-violet-400" /> Laboratorio de pruebas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ejecuta los dos detectores sobre cualquier texto. Nada de lo que escribas aquí se guarda ni se
          publica. Los ejemplos precargados son ejemplos de prueba y nunca aparecen como publicaciones
          reales de usuarios.
        </p>
      </header>

      <section className="glass-card p-5">
        <h2 className="font-display text-lg font-semibold text-white">Ejemplos de prueba</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(i)}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-violet-400/40"
            >
              <p className="text-sm font-medium text-slate-200">{ex.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{ex.expect}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-white">Texto a analizar</h2>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional en el laboratorio)" />
        <input className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Resumen (opcional)" />
        <textarea className={`${inputCls} min-h-40`} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto completo a analizar…" />
        <input className={inputCls} value={sources} onChange={(e) => setSources(e.target.value)} placeholder="Fuentes (opcional)" />
        <button
          onClick={run}
          disabled={running || content.trim().length < 2}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          <Play className="h-4 w-4" /> {running ? 'Analizando…' : 'Ejecutar detectores'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      {result && (
        <section className="space-y-4">
          <div className={`rounded-xl border p-4 text-sm font-medium ${wouldBeLabel[result.wouldBe].cls}`}>
            Veredicto combinado: {wouldBeLabel[result.wouldBe].text}
          </div>
          <ReviewPanel review={result.review} />
        </section>
      )}
    </div>
  )
}
