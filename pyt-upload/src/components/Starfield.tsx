import { useMemo } from 'react'

interface Star {
  left: string
  top: string
  size: number
  duration: string
  delay: string
  max: number
}

/** Campo de estrellas sutil: ~90 puntos con parpadeo suave, sin canvas. */
export default function Starfield() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: `${(i * 37.7 + 13) % 100}%`,
        top: `${(i * 53.3 + 7) % 100}%`,
        size: 1 + ((i * 7) % 3) * 0.7,
        duration: `${3 + ((i * 11) % 50) / 10}s`,
        delay: `${((i * 17) % 40) / 10}s`,
        max: 0.35 + ((i * 13) % 50) / 100,
      })),
    [],
  )
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              '--tw-duration': s.duration,
              '--tw-delay': s.delay,
              '--tw-max': s.max,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
