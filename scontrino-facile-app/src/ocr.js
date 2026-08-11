import { createWorker } from 'tesseract.js'
import workerPath from 'tesseract.js/dist/worker.min.js?url'
import corePath from 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url'

let workerPromise = null

function getWorker() {
  // Motore OCR (worker + wasm) servito insieme all'app, non da CDN: parte anche offline
  // dopo il primo caricamento. I dati delle lingue (italiano + inglese, per leggere meglio
  // scontrini/screenshot non italiani) restano remoti (~4+4MB, scaricati una volta sola).
  if (!workerPromise) {
    workerPromise = createWorker('ita+eng', 1, { workerPath, corePath })
  }
  return workerPromise
}

// Scala di grigi + aumento del contrasto: aiuta l'OCR su foto sfocate o con luce non
// uniforme. Gira interamente lato client con un canvas, prima di passare l'immagine
// a Tesseract. Se qualcosa va storto (es. immagine cross-origin), usa l'originale.
function preprocessImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const contrast = 1.35
        const intercept = 128 * (1 - contrast)
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          const adjusted = Math.min(255, Math.max(0, gray * contrast + intercept))
          data[i] = data[i + 1] = data[i + 2] = adjusted
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
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
  const processed = await preprocessImage(imageSource)
  const { data } = await withTimeout(worker.recognize(processed), 30000)
  return parseReceiptText(data.text || '')
}

// Simboli e codici valuta riconosciuti nell'importo — non solo l'euro, così gli scontrini
// in dollari, sterline, rupie (incluse quelle mauriziane) o altre valute vengono letti lo
// stesso. L'app somma comunque tutto come se fosse un unico totale (nessuna conversione).
const CUR = '(?:€|\\$|£|¥|₹|₨|Rs\\.?|EUR|USD|GBP|JPY|CHF|CAD|AUD|INR|MUR|CNY|BRL|MXN|ZAR)'
const TOTAL_LINE = new RegExp(`(totale|importo|tot\\.?|total|amount|grand\\s*total|somma)\\s*(?:${CUR})?\\s*[:\\-]?\\s*(?:${CUR})?\\s*(?<amount>\\d{1,6}[.,]\\d{2})\\s*(?:${CUR})?`, 'i')
const PRICE_AT_END = new RegExp(`(?:${CUR})?\\s*(?<amount>\\d{1,4}[.,]\\d{2})\\s*(?:${CUR})?\\s*$`)
// Riga fatta solo di un importo (comune negli screenshot di pagamento: l'importo è isolato,
// spesso il testo più grande dello schermo, senza un'etichetta "TOTALE" accanto).
const STANDALONE_AMOUNT = new RegExp(`^[+\\-]?\\s*(?:${CUR})?\\s*(?<amount>\\d{1,5}[.,]\\d{2})\\s*(?:${CUR})?$`)
// "Inviato a Mario Rossi", "Pagato a: Bar Centrale", "Destinatario Esselunga" — il beneficiario
// di un pagamento digitale conta più della prima riga di testo (che è spesso l'header dell'app).
const RECIPIENT_LINE = /(?:inviato a|pagato a|destinatario|beneficiario|ricevuto da|sent to|paid to|a:)\s*[:\-]?\s*(.+)/i
const DATE_PATTERN = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/
const MONTHS_IT = {
  gennaio: 0, gen: 0, febbraio: 1, feb: 1, marzo: 2, mar: 2, aprile: 3, apr: 3, maggio: 4, mag: 4,
  giugno: 5, giu: 5, luglio: 6, lug: 6, agosto: 7, ago: 7, settembre: 8, set: 8, ottobre: 9, ott: 9,
  novembre: 10, nov: 10, dicembre: 11, dic: 11,
  // varianti inglesi non già coperte dalle abbreviazioni italiane sopra
  january: 0, jan: 0, february: 1, march: 2, april: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
  august: 7, aug: 7, september: 8, sep: 8, october: 9, oct: 9, november: 10, december: 11, dec: 11,
}
const LONG_DATE_PATTERN = new RegExp(`(\\d{1,2})\\s+(${Object.keys(MONTHS_IT).join('|')})\\.?\\s+(\\d{4})`, 'i')
const NOISE_LINE = /^(p\.?\s?iva|c\.?\s?f\.?|cod\.?\s?fisc|via |viale |corso |tel\.?|phone|scontrino|receipt|documento|n\.\s?\d|iban|causale|completat|inviat|in corso)/i
const ADDRESS_LINE = /^(via|viale|v\.le|corso|c\.so|piazza|p\.zza|largo|vicolo|strada|contrada|street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|boulevard|blvd\.|drive|dr\.)\s+.+/i
const PHONE_LINE = /(?:tel|phone|ph|mobile|cell|contact)\.?\s*[:\-]?\s*(\+?\d[\d\s\/\-]{6,15}\d)/i
const VAT_LINE = /p\.?\s?iva\s*[:\-]?\s*(\d{11})/i
const CF_LINE = /c\.?\s?f\.?\s*[:\-]?\s*([A-Z0-9]{11,16})/i

function toNumber(str) {
  return Number(str.replace(/\./g, '').replace(',', '.'))
}

// Restituisce null (invece di una data "a caso") se l'OCR ha letto rumore che assomiglia
// a una data ma con un anno non plausibile — es. scontrini sgualciti o poco leggibili,
// dove una cifra fraintesa può produrre anni assurdi tipo "1095" o "3062".
function toIsoDate(day, month, year) {
  if (String(year).length === 2) year = `20${year}`
  const y = Number(year)
  const currentYear = new Date().getFullYear()
  if (y < currentYear - 8 || y > currentYear + 1) return null
  const date = new Date(y, Number(month), Number(day))
  if (Number.isNaN(date.getTime())) return null
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
    if (m) { date = toIsoDate(m[1], Number(m[2]) - 1, m[3]); if (date) break }
    const lm = line.match(LONG_DATE_PATTERN)
    if (lm) { date = toIsoDate(lm[1], MONTHS_IT[lm[2].toLowerCase()], lm[3]); if (date) break }
  }

  let total = null
  let totalSource = 'manualOverride'
  for (const line of lines) {
    const m = line.match(TOTAL_LINE)
    if (m) {
      total = toNumber(m.groups.amount)
      totalSource = 'ocrDetected'
      break
    }
  }

  // Dettagli anagrafici dell'esercente, quando lo scontrino li riporta (non tutti i formati
  // digitali/screenshot li hanno): indirizzo, telefono, partita IVA o codice fiscale.
  let address = null
  let phone = null
  let vat = null
  for (const line of lines) {
    if (!address && ADDRESS_LINE.test(line)) address = line.replace(/\s{2,}/g, ' ').trim().slice(0, 60)
    if (!phone) {
      const m = line.match(PHONE_LINE)
      if (m) phone = m[1].replace(/\s{2,}/g, ' ').trim()
    }
    if (!vat) {
      const m = line.match(VAT_LINE) || line.match(CF_LINE)
      if (m) vat = m[1].toUpperCase()
    }
  }

  const items = []
  for (const line of lines) {
    if (TOTAL_LINE.test(line) || NOISE_LINE.test(line) || STANDALONE_AMOUNT.test(line)) continue
    const m = line.match(PRICE_AT_END)
    if (!m) continue
    const amount = toNumber(m.groups.amount)
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
      .map((m) => toNumber(m.groups.amount))
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
    address: address || '',
    phone: phone || '',
    vat: vat || '',
    ocrRawText: rawText,
  }
}
