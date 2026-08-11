import { useIdbState } from './idb'

const IDB_KEY = 'tickets'

export const TICKET_TYPES = [
  { id: 'treno', label: 'Treno', icon: 'Train' },
  { id: 'aereo-bus', label: 'Aereo / Bus', icon: 'Plane' },
  { id: 'evento', label: 'Evento', icon: 'Music' },
  { id: 'altro', label: 'Altro', icon: 'Ticket' },
]

// Funzione a sé (invece di infilarla nel componente) perché serve sia nello screen sia
// per l'ordinamento qui sotto: un biglietto è "passato" se ha una data e questa è prima
// di oggi (confronto solo sul giorno, non sull'ora, così un biglietto di oggi resta tra
// i prossimi anche a sera inoltrata).
export function isPastTicket(ticket) {
  if (!ticket.date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(ticket.date) < today
}

// Un vero wallet mette in primo piano i biglietti che servono a breve: prima quelli con
// data futura (o odierna) più vicina, poi quelli senza data (creati ma non ancora
// programmati), infine quelli passati — utili da ritrovare ma non da vedere per primi.
export function sortTickets(tickets) {
  return [...tickets].sort((a, b) => {
    const aPast = isPastTicket(a)
    const bPast = isPastTicket(b)
    if (aPast !== bPast) return aPast ? 1 : -1
    if (!a.date && !b.date) return b.createdAt.localeCompare(a.createdAt)
    if (!a.date) return 1
    if (!b.date) return -1
    return aPast ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  })
}

// Niente PIN qui, a differenza del Vault: un biglietto (treno, aereo, evento) va spesso
// mostrato al volo — a un controllore, all'ingresso — dove fermarsi a digitare un codice
// sarebbe solo d'intralcio. IndexedDB come tutti gli altri moduli dati (vedi idb.js),
// nessuna migrazione da un vecchio formato perché è una sezione nuova.
export function useTickets() {
  return useIdbState(IDB_KEY, [])
}
