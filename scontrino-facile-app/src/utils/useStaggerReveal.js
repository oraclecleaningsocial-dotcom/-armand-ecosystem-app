import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Sostituisce lo sfalsamento a scatti fatto solo di CSS (animation-delay fisso per i
// primi 6 elementi, poi tutti uguali) con un vero stagger GSAP: nessun tetto al numero
// di righe, easing "back.out" con un piccolo overshoot invece del semplice ease-out CSS
// — il tipo di rimbalzo fisico che si vede spesso nelle demo di gsap.com. useLayoutEffect
// (non useEffect) imposta lo stato di partenza PRIMA che il browser dipinga il frame,
// altrimenti ci sarebbe un istante visibile con le righe già a piena opacità prima che
// l'animazione parta.
export function useStaggerReveal(deps = []) {
  const ref = useRef(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return
    const items = container.querySelectorAll(':scope > *')
    if (!items.length) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 14, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.045 },
    )
    return () => tween.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
