// La lingua dell'interfaccia (it/en/fr) determina anche come si formattano numeri e
// date (virgola vs punto decimale, ordine giorno/mese, nomi dei mesi) — mutata da
// setFormatLocale() quando l'utente cambia lingua nelle Impostazioni, letta da ogni
// chiamata successiva a eur()/formatDate()/relativeDate(). Stato a livello di modulo
// per evitare di dover passare `lang` in ogni singola chiamata sparsa nell'app.
const LOCALE_MAP = { it: 'it-IT', en: 'en-GB', fr: 'fr-FR' }
let currentLocale = 'it-IT'

export function setFormatLocale(lang) {
  currentLocale = LOCALE_MAP[lang] || 'it-IT'
}

export function getFormatLocale() {
  return currentLocale
}

export function eur(n) {
  return (Number(n) || 0).toLocaleString(currentLocale, { style: 'currency', currency: 'EUR' })
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// "YYYY-MM-DD" nel fuso orario locale, costruita SENZA mai passare da toISOString():
// con un fuso avanti rispetto a UTC (es. Italia, UTC+1/+2), la mezzanotte locale
// convertita in UTC scivola al giorno prima, disallineando di un giorno scontrini,
// promemoria e celle del calendario rispetto a quello che l'utente vede e tocca.
export function toLocalDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// L'inverso: da "YYYY-MM-DD" a un Date a mezzanotte locale. `new Date("YYYY-MM-DD")`
// tratta le stringhe solo-data come UTC per specifica — usarla e poi formattare in
// locale reintrodurrebbe lo stesso disallineamento di un giorno sul lato display.
export function fromLocalDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Alcuni valori (data ricevuta, scadenza) sono solo-data e vanno letti in locale;
// altri (createdAt di documenti/prodotti) sono timestamp completi con ora e fuso,
// per cui new Date(...) è già corretto. Si distingue in base al formato.
function parseDateValue(value) {
  if (typeof value === 'string' && DATE_ONLY.test(value)) return fromLocalDateKey(value)
  return new Date(value)
}

export function formatDate(iso) {
  return parseDateValue(iso).toLocaleDateString(currentLocale, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Piccolo dizionario locale, non preso da translations.js: format.js è usato anche
// fuori da componenti React (nessun accesso comodo a useI18n), e importare da
// translations.js qui rischierebbe un ciclo con moduli che already importano da qui.
const RELATIVE_STRINGS = {
  'it-IT': { today: 'oggi', yesterday: 'ieri', daysAgo: (n) => `${n} giorni fa` },
  'en-GB': { today: 'today', yesterday: 'yesterday', daysAgo: (n) => `${n} days ago` },
  'fr-FR': { today: "aujourd'hui", yesterday: 'hier', daysAgo: (n) => `il y a ${n} jours` },
}

export function relativeDate(iso) {
  const d = parseDateValue(iso)
  const today = new Date()
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000)
  const strings = RELATIVE_STRINGS[currentLocale] || RELATIVE_STRINGS['it-IT']
  if (diffDays === 0) return strings.today
  if (diffDays === 1) return strings.yesterday
  if (diffDays > 1 && diffDays < 7) return strings.daysAgo(diffDays)
  return formatDate(iso)
}
