import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// In modalità standalone (icona salvata sulla Home) su iOS, ogni misura di altezza
// "visibile" provata finora — 100dvh, 100svh, window.innerHeight, window.visualViewport,
// perfino position:fixed con inset:0 che non calcola nulla — ha comunque lasciato un
// vuoto in fondo allo schermo, confermato con screenshot dopo ogni tentativo. In Safari
// normale (tab), invece, va sempre tutto bene: il problema è isolato alla sola modalità
// standalone. window.screen.height è la dimensione fisica reale dello schermo, non
// un valore di viewport che il motore deve dedurre — qui la applichiamo via JS come
// altezza esplicita, ma solo in standalone: la modalità browser (che già funziona bene)
// resta sul CSS position:fixed/inset:0, dato che lì screen.height sarebbe scorretta
// (includerebbe l'area occupata dalla barra di Safari).
function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function syncStandaloneHeight() {
  if (!isStandalone()) return
  document.documentElement.style.setProperty('--standalone-height', `${window.screen.height}px`)
  document.body.classList.add('is-standalone')
}
syncStandaloneHeight()
window.addEventListener('resize', syncStandaloneHeight)
window.addEventListener('orientationchange', syncStandaloneHeight)
window.addEventListener('pageshow', syncStandaloneHeight)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
