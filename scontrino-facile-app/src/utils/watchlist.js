const STORAGE_KEY = 'scontrino_facile_watchlist'

function createId() {
  return `wl_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // dato corrotto o storage non disponibile: si riparte da una lista vuota
  }
  return []
}

export function saveWatchlist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage pieno o non disponibile: la sessione continua solo in memoria
  }
}

export function addWatchlistItem(items, ticker, price) {
  const next = [...items, { id: createId(), ticker: ticker.toUpperCase(), price }]
  saveWatchlist(next)
  return next
}

export function removeWatchlistItem(items, id) {
  const next = items.filter((i) => i.id !== id)
  saveWatchlist(next)
  return next
}
