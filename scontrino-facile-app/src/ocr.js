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
const DATE_PATTERN = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/
const NOISE_LINE = /^(p\.?\s?iva|c\.?\s?f\.?|cod\.?\s?fisc|via |viale |corso |tel\.?|scontrino|documento|n\.\s?\d)/i

function toNumber(str) {
  return Number(str.replace(/\./g, '').replace(',', '.'))
}

function toIsoDate(match) {
  let [, d, m, y] = match
  if (y.length === 2) y = `20${y}`
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

// Estrae negozio, data, totale e voci dal testo grezzo OCR con euristiche su posizione e pattern.
export function parseReceiptText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let merchant = lines.find((l) => !NOISE_LINE.test(l) && !/^\d+$/.test(l) && l.length > 2) || ''
  merchant = merchant.replace(/\s{2,}/g, ' ').slice(0, 40)

  let date = null
  for (const line of lines) {
    const m = line.match(DATE_PATTERN)
    if (m) {
      date = toIsoDate(m)
      break
    }
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
    if (TOTAL_LINE.test(line) || NOISE_LINE.test(line)) continue
    const m = line.match(PRICE_AT_END)
    if (!m) continue
    const amount = toNumber(m[1])
    const name = line.slice(0, m.index).trim().replace(/[.\-*]+$/, '').trim()
    if (name && amount > 0 && amount < 1000) items.push({ name: name.slice(0, 40), amount })
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
