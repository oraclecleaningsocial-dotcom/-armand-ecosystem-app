import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './i18n'
import './styles.css'

// Rete di sicurezza per iOS che non supporta ancora interactive-widget=resizes-content
// (impostato in index.html): su quelle versioni, dopo ogni apertura/chiusura della
// tastiera (ricerca, promemoria, importi...) Safari in modalità standalone a volte lascia
// gli elementi position:fixed (la tab bar) ancorati al viewport di prima, con un gap sotto
// di dimensione variabile finché non arriva un ricalcolo. window.scrollTo(0,0) forza
// Safari a ricalcolare subito, invece di aspettare un'altra interazione a caso.
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => window.scrollTo(0, 0))
}

// --app-height: altezza reale del viewport visibile, misurata da JS e riscritta ogni
// volta che cambia, invece di fidarsi solo di un'unità CSS (100dvh incluso). Su iOS
// Safari, in certe condizioni (subito al primo caricamento, dopo la rotazione, con la
// barra degli indirizzi che si nasconde/mostra), anche dvh può restare ancorato a un
// valore ormai scaduto per un istante — questo si aggiorna leggendo direttamente
// visualViewport.height (la fonte più autorevole disponibile), lasciando che .app-shell
// in styles.css lo usi con `var(--app-height, 100dvh)`: se lo script non ha ancora
// girato la prima volta, resta comunque il 100dvh come prima. È esattamente lo spazio
// vuoto sotto la tab bar segnalato via screenshot: il gap compariva quando l'unità CSS
// da sola non rifletteva ancora l'altezza vera.
function setAppHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${h}px`)
}
setAppHeight()
window.visualViewport?.addEventListener('resize', setAppHeight)
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', setAppHeight)

// Senza persistenza "esplicita", il browser può liberare i dati salvati (scontrini,
// documenti, ecc.) sotto pressione di spazio o dopo periodi di inattività — l'unico
// posto dove vivono, non essendoci un backend. navigator.storage.persist() chiede al
// browser di trattarli come persistenti ed esentarli da quella pulizia automatica.
// Best-effort: se non supportato o negato, l'app funziona comunque, solo senza garanzia.
navigator.storage?.persist?.().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)
