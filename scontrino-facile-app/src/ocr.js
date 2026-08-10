import { createWorker } from 'tesseract.js'
import workerPath from 'tesseract.js/dist/worker.min.js?url'
import corePath from 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url'

let workerPromise = null

function getWorker() {
  // Motore OCR (worker + wasm) servito insieme all'app, non da CDN: parte anche offline
  // dopo il primo caricamento. Solo i dati della lingua italiana restano remoti (~4MB).
  if (!workerPromise) {
    workerPromise = createWorker('ita', 1, { workerPath, corePath })
  }
  return workerPromise
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('OCR timeout')), ms)
    promise.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

// Legge il testo dallo scontrino. 100% lato client: l'immagine non lascia mai il dispositivo.
// Un timeout garantisce che l'attesa non resti bloccata se la rete è lenta o assente
// (ad es. al primo utilizzo, quando servono i dati della lingua italiana).
export async function recognizeReceipt(imageSource) {
  const worker = await withTimeout(getWorker(), 30000)
  const { data } = await withTimeout(worker.recognize(imageSource), 30000)
  return parseReceiptText(data.text || '')
}

const TOTAL_LINE = /(totale|importo|tot\.?)\s*(euro|eur|€)?\s*[:\-]?\s*€?\s*(\d{1,4}[.,]\d{2})/i
const PRICE_AT_END = /(\d{1,4}[.,]\d{2})\s*(?:€|eur)?\s*$/
// Riga fatta solo di un importo (comune negli screenshot di pagamento: l'importo è isolato,
// spesso il testo più grande dello schermo, senza un'etichetta "TOTALE" accanto).
const STANDALONE_AMOUNT = /^[+\-]?\s*€?\s*(\d{1,5}[.,]\d{2})\s*€?$/
// "Inviato a Mario Rossi", "Pagato a: Bar Centrale", "Destinatario Esselunga" — il beneficiario
// di un pagamento digitale conta più della prima riga di testo (che è spesso l'header dell'app).
const RECIPIENT_LINE = /(?:inviato a|pagato a|destinatario|beneficiario|ricevuto da|a:)\s*[:\-]?\s*(.+)/i
const DATE_PATTERN = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/
const MONTHS_IT = { gennaio: 0, gen: 0, febbraio: 1, feb: 1, marzo: 2, mar: 2, aprile: 3, apr: 3, maggio: 4, mag: 4, giugno: 5, giu: 5, luglio: 6, lug: 6, agosto: 7, ago: 7, settembre: 8, set: 8, ottobre: 9, ott: 9, novembre: 10, nov: 10, dicembre: 11, dic: 11 }
const LONG_DATE_PATTERN = new RegExp(`(\\d{1,2})\\s+(${Object.keys(MONTHS_IT).join('|')})\\.?\\s+(\\d{4})`, 'i')
const NOISE_LINE = /^(p\.?\s?iva|c\.?\s?f\.?|cod\.?\s?fisc|via |viale |corso |tel\.?|scontrino|documento|n\.\s?\d|iban|causale|completat|inviat|in corso)/i

function toNumber(str) {
  return Number(str.replace(/\./g, '').replace(',', '.'))
}

function toIsoDate(day, month, year) {
  if (String(year).length === 2) year = `20${year}`
  const date = new Date(Number(year), Number(month), Number(day))
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

// Estrae negozio/beneficiario, data, totale e voci dal testo grezzo OCR con euristiche su
// posizione e pattern — valide sia per scontrini cartacei sia per screenshot di pagamenti
// digitali (PayPal, Satispay, bonifici, app bancarie), che non hanno una riga "TOTALE" esplicita.
export function parseReceiptText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const recipientLine = lines.map((l) => l.match(RECIPIENT_LINE)).find(Boolean)
  let merchant = recipientLine ? recipientLine[1] : (lines.find((l) => !NOISE_LINE.test(l) && !/^\d+$/.test(l) && l.length > 2) || '')
  merchant = merchant.replace(/\s{2,}/g, ' ').replace(/[.\-*€\d\s]+$/, '').trim().slice(0, 40)

  let date = null
  for (const line of lines) {
    const m = line.match(DATE_PATTERN)
    if (m) { date = toIsoDate(m[1], Number(m[2]) - 1, m[3]); break }
    const lm = line.match(LONG_DATE_PATTERN)
    if (lm) { date = toIsoDate(lm[1], MONTHS_IT[lm[2].toLowerCase()], lm[3]); break }
  }

  let total = null
  let totalSource = 'manualOverride'
  for (const line of lines) {
    const m = line.match(TOTAL_LINE)
    if (m) {
      total = toNumber(m[3])
      totalSource = 'ocrDetected'
      break
    }
  }

  const items = []
  for (const line of lines) {
    if (TOTAL_LINE.test(line) || NOISE_LINE.test(line) || STANDALONE_AMOUNT.test(line)) continue
    const m = line.match(PRICE_AT_END)
    if (!m) continue
    const amount = toNumber(m[1])
    const name = line.slice(0, m.index).trim().replace(/[.\-*]+$/, '').trim()
    if (name && amount > 0 && amount < 1000) items.push({ name: name.slice(0, 40), amount })
  }

  // Nessuna riga "TOTALE"/"IMPORTO" trovata: probabile screenshot di pagamento, dove
  // l'importo compare da solo su una riga. Si prende il più grande (le commissioni,
  // se presenti, sono in genere più piccole della cifra principale).
  if (total == null) {
    const standalone = lines
      .map((l) => l.match(STANDALONE_AMOUNT))
      .filter(Boolean)
      .map((m) => toNumber(m[1]))
    if (standalone.length) {
      total = Math.max(...standalone)
      totalSource = 'ocrDetected'
    }
  }

  if (total == null) {
    if (items.length) {
      total = Math.round(items.reduce((s, it) => s + it.amount, 0) * 100) / 100
      totalSource = 'calculatedFromItems'
    } else {
      total = 0
      totalSource = 'manualOverride'
    }
  }

  return {
    merchant: merchant || 'Esercente sconosciuto',
    date: date || new Date().toISOString().slice(0, 10),
    total,
    totalSource,
    items,
    ocrRawText: rawText,
  }
}
