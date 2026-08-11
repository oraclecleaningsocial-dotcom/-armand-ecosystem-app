import { useEffect, useRef } from 'react'

// Le schermate (Home, Ricerca, Calendario, Report...) si smontano e rimontano ogni volta
// che si naviga altrove e si torna indietro (es. apri la Calcolatrice e chiudi): senza
// questo, lo scroll riparte sempre da zero. La posizione vive qui, fuori da React, così
// sopravvive allo smontaggio del componente (si azzera solo con un refresh della pagina).
const positions = new Map()

export function useScrollRestore(key) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const saved = positions.get(key)
    if (saved) el.scrollTop = saved

    function onScroll() {
      positions.set(key, el.scrollTop)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      positions.set(key, el.scrollTop)
      el.removeEventListener('scroll', onScroll)
    }
  }, [key])

  return ref
}
