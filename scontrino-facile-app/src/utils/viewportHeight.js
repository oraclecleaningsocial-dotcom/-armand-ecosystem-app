// --vh-fallback: rete di sicurezza indipendente da 100dvh (vedi styles.css, dove è usata
// come min-height insieme a 100dvh — vince la più alta delle due, mai la più corta). Su
// iOS Safari sia le unità vh/dvh sia una singola misura fatta all'avvio possono restare
// ancorate a un'altezza ormai scaduta per un istante, lasciando la tab bar staccata dal
// fondo reale dello schermo finché qualcosa non la ricalcola. Esportata (non solo usata
// internamente in main.jsx) così anche un tocco manuale — vedi il pulsante di refresh in
// App.jsx, per i rari casi in cui nessuno degli eventi sotto scatta in tempo — può
// richiamare esattamente la stessa funzione.
export function recalcViewportHeight() {
  document.documentElement.style.setProperty('--vh-fallback', `${window.innerHeight * 0.01}px`)
}

export function setupViewportHeightTracking() {
  recalcViewportHeight()
  setTimeout(recalcViewportHeight, 300)
  setTimeout(recalcViewportHeight, 1000)
  window.addEventListener('resize', recalcViewportHeight)
  window.addEventListener('orientationchange', recalcViewportHeight)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recalcViewportHeight()
  })
  // Il tocco che fa comparire/sparire la barra degli indirizzi di Safari non sempre
  // scatena da solo un resize del layout viewport in tempo utile — un tocco qualsiasi
  // sullo schermo è un'occasione a costo zero per ricontrollare.
  window.addEventListener('touchend', recalcViewportHeight, { passive: true })
  window.addEventListener('pageshow', recalcViewportHeight)
}
