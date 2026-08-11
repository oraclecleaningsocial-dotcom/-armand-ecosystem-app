// Scadenze fiscali italiane più comuni per una persona fisica. Elenco curato a mano:
// non esiste una fonte pubblica interrogabile "in tempo reale" da un'app client-only
// (niente backend, niente scraping affidabile del sito dell'Agenzia delle Entrate),
// quindi queste date sono di riferimento generale — verificale sempre sul sito
// ufficiale per il tuo caso specifico, soprattutto se cambiano di anno in anno.
export const FISCAL_DEADLINES = [
  { id: 'f24-mensile', title: 'F24 mensile', monthly: true, day: 16, description: 'Versamento di ritenute, contributi e IVA mensile, se dovuti.' },
  { id: 'iva-trim-1', title: 'IVA I trimestre', month: 5, day: 16, description: 'Liquidazione IVA trimestrale, primo trimestre.' },
  { id: 'iva-trim-2', title: 'IVA II trimestre', month: 8, day: 20, description: 'Liquidazione IVA trimestrale, secondo trimestre.' },
  { id: 'iva-trim-3', title: 'IVA III trimestre', month: 11, day: 16, description: 'Liquidazione IVA trimestrale, terzo trimestre.' },
  { id: 'iva-trim-4', title: 'IVA IV trimestre', month: 3, day: 16, description: 'Liquidazione IVA trimestrale, quarto trimestre (anno successivo).' },
  { id: 'precompilata', title: 'Dichiarazione precompilata', startMonth: 4, startDay: 30, endMonth: 9, endDay: 30, description: 'Finestra per consultare, modificare e inviare il 730 / Redditi precompilato.' },
  { id: 'saldo-irpef', title: 'Saldo IRPEF e primo acconto', month: 6, day: 30, description: 'Versamento saldo imposte sui redditi e primo acconto, senza maggiorazione.' },
  { id: 'saldo-irpef-magg', title: 'Saldo IRPEF (con maggiorazione)', month: 7, day: 30, description: 'Ultimo termine per il saldo, con lo 0,4% di maggiorazione a titolo di interesse.' },
  { id: 'secondo-acconto', title: 'Secondo acconto imposte', month: 11, day: 30, description: 'Versamento del secondo (o unico) acconto IRPEF.' },
  { id: 'imu-acconto', title: 'IMU — acconto', month: 6, day: 16, description: 'Prima rata IMU per chi possiede immobili soggetti.' },
  { id: 'imu-saldo', title: 'IMU — saldo', month: 12, day: 16, description: 'Saldo IMU per chi possiede immobili soggetti.' },
  { id: 'cu', title: 'Certificazione Unica (CU)', month: 3, day: 16, description: 'Termine per l\'invio della CU da parte dei sostituti d\'imposta (datori di lavoro).' },
]

function withYear(month, day, year) {
  return new Date(year, month - 1, day)
}

// Prossima occorrenza di una data ricorrente (stesso mese/giorno ogni anno): se è già
// passata quest'anno, restituisce quella dell'anno prossimo.
function nextYearly(month, day, from) {
  const year = from.getFullYear()
  let d = withYear(month, day, year)
  if (d < from) d = withYear(month, day, year + 1)
  return d
}

function nextMonthly(day, from) {
  let d = new Date(from.getFullYear(), from.getMonth(), day)
  if (d < from) d = new Date(from.getFullYear(), from.getMonth() + 1, day)
  return d
}

const MS_PER_DAY = 86400000

export function getUpcomingDeadlines(from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())

  return FISCAL_DEADLINES.map((d) => {
    if (d.startMonth) {
      let start = nextYearly(d.startMonth, d.startDay, today)
      let end = withYear(d.endMonth, d.endDay, start.getFullYear())
      // la finestra può attraversare l'anno solare (es. dicembre-gennaio): se la fine
      // cade prima dell'inizio, appartiene all'anno successivo
      if (end < start) end = withYear(d.endMonth, d.endDay, start.getFullYear() + 1)
      // se oggi è già dentro la finestra dell'anno corrente, mostra quella attiva
      const startThisYear = withYear(d.startMonth, d.startDay, today.getFullYear())
      const endThisYear = withYear(d.endMonth, d.endDay, today.getFullYear())
      const active = today >= startThisYear && today <= endThisYear
      if (active) { start = startThisYear; end = endThisYear }
      return { ...d, isRange: true, start, end, active, daysUntil: Math.round((start - today) / MS_PER_DAY) }
    }
    const date = d.monthly ? nextMonthly(d.day, today) : nextYearly(d.month, d.day, today)
    return { ...d, isRange: false, date, active: false, daysUntil: Math.round((date - today) / MS_PER_DAY) }
  }).sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return a.daysUntil - b.daysUntil
  })
}

function isoDate(year, monthIndex, day) {
  return new Date(year, monthIndex, day).toISOString().slice(0, 10)
}

// Tutte le occorrenze delle scadenze fiscali in un dato anno solare, come semplici coppie
// data/titolo — usato per mostrarle come indicatori nel calendario (a differenza di
// getUpcomingDeadlines, che restituisce solo la prossima occorrenza di ciascuna).
export function getDeadlinesForYear(year) {
  const out = []
  for (const d of FISCAL_DEADLINES) {
    if (d.monthly) {
      for (let m = 0; m < 12; m++) out.push({ id: `${d.id}-${m}`, title: d.title, date: isoDate(year, m, d.day) })
    } else if (d.startMonth) {
      out.push({ id: `${d.id}-start`, title: `${d.title} (inizio)`, date: isoDate(year, d.startMonth - 1, d.startDay) })
      out.push({ id: `${d.id}-end`, title: `${d.title} (fine)`, date: isoDate(year, d.endMonth - 1, d.endDay) })
    } else {
      out.push({ id: d.id, title: d.title, date: isoDate(year, d.month - 1, d.day) })
    }
  }
  return out
}
