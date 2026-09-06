import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './i18n'
import './styles.css'

// --vh-fallback: rete di sicurezza indipendente da 100dvh (vedi styles.css, dove è usata
// come min-height insieme a 100dvh — vince la più alta delle due, mai la più corta). Su
// iOS Safari sia le unità vh/dvh sia una singola misura fatta all'avvio possono restare
// ancorate a un'altezza ormai scaduta per un istante (tipicamente proprio al primissimo
// caricamento, prima che la UI di Safari si assesti) — da qui il rimisurare non solo su
// resize/orientamento ma anche con un paio di controlli ritardati subito dopo l'avvio e
// ogni volta che l'app torna in primo piano (l'utente la riapre da un'altra app).
function setVhFallback() {
  document.documentElement.style.setProperty('--vh-fallback', `${window.innerHeight * 0.01}px`)
}
setVhFallback()
setTimeout(setVhFallback, 300)
setTimeout(setVhFallback, 1000)
window.addEventListener('resize', setVhFallback)
window.addEventListener('orientationchange', setVhFallback)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setVhFallback()
})

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
