// Ogni modulo di stato (state.js, vault.js, reminders.js, notes.js, products.js) salva
// su localStorage dentro un try/catch che, prima, ignorava in silenzio un salvataggio
// fallito per spazio esaurito — l'utente continuava a usare l'app pensando che tutto
// fosse salvato, per poi trovare dati mancanti alla riapertura. Questo è un canale
// minimo per far arrivare l'errore fino a App.jsx, che lo mostra come toast.
const listeners = new Set()

export function onStorageError(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function reportStorageError() {
  listeners.forEach((cb) => cb())
}

export function isQuotaError(err) {
  return err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014
}
