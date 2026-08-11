import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// 100dvh e la media query display-mode:standalone non sono bastati a inseguire
// l'altezza reale su iPhone in modalità app installata (icona sulla Home): il gap
// vuoto sotto la tab bar segnalato per tutta la sessione tornava comunque. window.visualViewport
// è l'unica API pensata apposta per questo — misura l'area visibile vera, non un
// valore CSS che il motore approssima — e funziona identica sia in Safari normale
// sia da icona installata. Il valore va in una custom property che l'altezza
// dell'app usa al posto di 100dvh.
function syncViewportHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--vvh', `${h}px`)
}
syncViewportHeight()
window.visualViewport?.addEventListener('resize', syncViewportHeight)
window.addEventListener('resize', syncViewportHeight)
window.addEventListener('orientationchange', syncViewportHeight)
window.addEventListener('pageshow', syncViewportHeight)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
