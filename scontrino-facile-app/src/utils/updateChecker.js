import { useEffect, useState } from 'react'

// La causa più comune dei "bug fantasma" segnalati più volte in questa app: su iOS,
// un'icona sulla schermata Home (o una scheda Safari lasciata aperta) può restare
// ferma su una versione vecchia molto più a lungo di quanto ci si aspetti, perché
// riaprirla non sempre equivale a un vero reload da rete. version.json è un file
// minuscolo scritto ad ogni build (vedi vite.config.js) con lo stesso timestamp
// incluso nel bundle JS come __BUILD_TIME__: interrogandolo con cache:'no-store' —
// che ignora esplicitamente qualunque copia locale — a intervalli e ogni volta che
// l'app torna in primo piano, si scopre con certezza se è uscita una versione più
// recente di quella in esecuzione, invece di doverlo dedurre da un bug che magari è
// già stato risolto.
const CHECK_INTERVAL_MS = 5 * 60 * 1000

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
        const { buildTime } = await res.json()
        if (!cancelled && buildTime && buildTime !== __BUILD_TIME__) setUpdateAvailable(true)
      } catch {
        // Offline o rete assente: nessun problema, si ritenterà al prossimo giro.
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return updateAvailable
}
