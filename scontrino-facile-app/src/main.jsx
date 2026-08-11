import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
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

// Senza persistenza "esplicita", il browser può liberare i dati salvati (scontrini,
// documenti, ecc.) sotto pressione di spazio o dopo periodi di inattività — l'unico
// posto dove vivono, non essendoci un backend. navigator.storage.persist() chiede al
// browser di trattarli come persistenti ed esentarli da quella pulizia automatica.
// Best-effort: se non supportato o negato, l'app funziona comunque, solo senza garanzia.
navigator.storage?.persist?.().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
