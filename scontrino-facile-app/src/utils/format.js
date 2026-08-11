export function eur(n) {
  return (Number(n) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
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
  return parseDateValue(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDate(iso) {
  const d = parseDateValue(iso)
  const today = new Date()
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000)
  if (diffDays === 0) return 'oggi'
  if (diffDays === 1) return 'ieri'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} giorni fa`
  return formatDate(iso)
}
