import { useEffect, useRef, useState } from 'react'

// Anima un numero dal valore precedente a quello nuovo invece di cambiarlo di scatto —
// usato sui totali principali (Home, Report). Parte sempre da 0 anche al primo montaggio
// (non solo sui cambi di valore successivi): Home e Report si smontano e rimontano ad
// ogni cambio di scheda, quindi partire da 0 fa sì che l'animazione si veda ogni volta
// che si visita la schermata, non solo la primissima volta in assoluto.
export function useCountUp(value, duration = 500) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = to
      setDisplay(to)
      return
    }
    let raf
    const start = performance.now()
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}
