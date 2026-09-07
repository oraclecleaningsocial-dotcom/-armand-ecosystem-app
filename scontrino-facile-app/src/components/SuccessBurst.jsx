import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Un unico momento "wow" per l'azione più soddisfacente dell'app (salvare una ricevuta),
// ispirato alle micro-animazioni di GSAP (timeline con easing fisico, non solo dissolvenze
// CSS) e al tipo di feedback "successo" che si vede spesso nelle animazioni Lottie
// (cerchio + spunta che si disegnano, piccole particelle che esplodono verso fuori) — qui
// costruito con un semplice SVG animato via GSAP invece di un file Lottie vero e proprio,
// così resta leggero, funziona offline e prende i colori del tema (--positive) invece di
// avere colori fissi incorporati nel file.
const PARTICLE_COUNT = 8

export default function SuccessBurst({ show, onDone }) {
  const circleRef = useRef(null)
  const checkRef = useRef(null)
  const wrapRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!show) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      const t = setTimeout(() => onDone?.(), 500)
      return () => clearTimeout(t)
    }

    const tl = gsap.timeline({ onComplete: () => onDone?.() })
    tl.set(wrapRef.current, { opacity: 1, scale: 1 })
      .fromTo(circleRef.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' })
      .fromTo(checkRef.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.32, ease: 'power2.out' }, '-=0.12')
      .fromTo(
        particlesRef.current,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        {
          x: (i) => Math.cos((i / PARTICLE_COUNT) * Math.PI * 2) * 44,
          y: (i) => Math.sin((i / PARTICLE_COUNT) * Math.PI * 2) * 44,
          opacity: 0,
          scale: 0.3,
          duration: 0.55,
          ease: 'power2.out',
          stagger: 0.02,
        },
        '-=0.1',
      )
      .to(wrapRef.current, { opacity: 0, scale: 0.92, duration: 0.28, ease: 'power1.in' }, '+=0.35')

    return () => tl.kill()
  }, [show, onDone])

  if (!show) return null

  return (
    <div className="success-burst" aria-hidden="true">
      <div className="success-burst-inner" ref={wrapRef}>
        <svg viewBox="0 0 120 120" width="96" height="96">
          <circle
            ref={circleRef}
            cx="60" cy="60" r="46"
            fill="none" stroke="var(--positive)" strokeWidth="6" strokeLinecap="round"
            pathLength="1" style={{ strokeDasharray: 1 }}
          />
          <path
            ref={checkRef}
            d="M38,62 L53,77 L84,42"
            fill="none" stroke="var(--positive)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
            pathLength="1" style={{ strokeDasharray: 1 }}
          />
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <circle
              key={i}
              ref={(el) => { particlesRef.current[i] = el }}
              cx="60" cy="60" r="3.5"
              fill="var(--positive)"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
