import { toLocalDateKey } from './utils/format'

// Feste nazionali italiane. Tutte a data fissa tranne Pasqua, che è mobile — calcolata
// con l'algoritmo di Gauss/Meeus per il calendario gregoriano (standard, non una
// tabella copiata anno per anno). Pasquetta è semplicemente il giorno dopo.
function computeEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const FIXED_HOLIDAYS = [
  { id: 'capodanno', title: 'Capodanno', month: 1, day: 1 },
  { id: 'epifania', title: 'Epifania', month: 1, day: 6 },
  { id: 'liberazione', title: 'Festa della Liberazione', month: 4, day: 25 },
  { id: 'lavoratori', title: 'Festa dei Lavoratori', month: 5, day: 1 },
  { id: 'repubblica', title: 'Festa della Repubblica', month: 6, day: 2 },
  { id: 'ferragosto', title: 'Ferragosto', month: 8, day: 15 },
  { id: 'ognissanti', title: 'Ognissanti', month: 11, day: 1 },
  { id: 'immacolata', title: 'Immacolata Concezione', month: 12, day: 8 },
  { id: 'natale', title: 'Natale', month: 12, day: 25 },
  { id: 'santo-stefano', title: 'Santo Stefano', month: 12, day: 26 },
]

// Tutte le feste di un anno solare, come coppie data/titolo — stesso formato di
// getDeadlinesForYear in fiscalDeadlines.js, così si comportano allo stesso modo come
// indicatori nel calendario.
export function getHolidaysForYear(year) {
  const out = FIXED_HOLIDAYS.map((h) => ({
    id: `${h.id}-${year}`,
    title: h.title,
    date: toLocalDateKey(new Date(year, h.month - 1, h.day)),
  }))
  const easter = computeEaster(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  out.push({ id: `pasqua-${year}`, title: 'Pasqua', date: toLocalDateKey(easter) })
  out.push({ id: `pasquetta-${year}`, title: "Lunedì dell'Angelo (Pasquetta)", date: toLocalDateKey(easterMonday) })
  return out
}
