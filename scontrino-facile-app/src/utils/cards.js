import { useIdbState } from './idb'

const IDB_KEY = 'loyaltyCards'

// A differenza dei biglietti (utils/tickets.js) una carta fedeltà non ha una data: resta
// valida indefinitamente, quindi qui l'ordinamento più utile è semplicemente alfabetico
// per nome — così, con tante carte salvate, si trova quella cercata a colpo d'occhio
// invece di scorrere in ordine di creazione.
export function sortCards(cards) {
  return [...cards].sort((a, b) => a.label.localeCompare(b.label, 'it', { sensitivity: 'base' }))
}

// Niente PIN, come per i biglietti: una carta fedeltà va mostrata al volo alla cassa,
// dove fermarsi a digitare un codice sarebbe solo d'intralcio. IndexedDB come tutti gli
// altri moduli dati (vedi idb.js), nessuna migrazione perché è una sezione nuova.
export function useCards() {
  return useIdbState(IDB_KEY, [])
}
