import { createWorker } from 'tesseract.js'
import workerPath from 'tesseract.js/dist/worker.min.js?url'
import corePath from 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url'
import { toLocalDateKey } from './utils/format'

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
  return parseReceiptText(data.text || '', data.lines || [])
}

// Simboli e codici valuta riconosciuti nell'importo — non solo l'euro, così gli scontrini
// in dollari, sterline, rupie (incluse quelle mauriziane) o altre valute vengono letti lo
// stesso. L'app somma comunque tutto come se fosse un unico totale (nessuna conversione).
const CUR = '(?:€|\\$|£|¥|₹|₨|Rs\\.?|EUR|USD|GBP|JPY|CHF|CAD|AUD|INR|MUR|CNY|BRL|MXN|ZAR)'
// Etichetta di "totale" ovunque nella riga: il vecchio pattern richiedeva l'importo
// incollato all'etichetta (solo valuta/due punti/trattino in mezzo), ma scontrini e
// soprattutto fatture usano spesso frasi come "TOTALE DOCUMENTO", "TOTALE A PAGARE",
// "IMPORTO TOTALE IVA COMPRESA" — con altre parole tra etichetta e importo. Qui si
// individua solo la riga giusta; l'importo si estrae a parte prendendo l'ULTIMO
// numero della riga (di solito il totale finale, non un IVA/percentuale intermedia).
const TOTAL_KEYWORD = /(totale|importo|tot\.?|total|amount|somma|dovuto|pagare)/i
const AMOUNT_ON_LINE = new RegExp(`(?:${CUR})?\\s*(?<amount>\\d{1,6}[.,]\\d{2})\\s*(?:${CUR})?`, 'g')
const PRICE_AT_END = new RegExp(`(?:${CUR})?\\s*(?<amount>\\d{1,4}[.,]\\d{2})\\s*(?:${CUR})?\\s*$`)
// Riga fatta solo di un importo (comune negli screenshot di pagamento: l'importo è isolato,
// spesso il testo più grande dello schermo, senza un'etichetta "TOTALE" accanto).
const STANDALONE_AMOUNT = new RegExp(`^[+\\-]?\\s*(?:${CUR})?\\s*(?<amount>\\d{1,5}[.,]\\d{2})\\s*(?:${CUR})?$`)
// "Inviato a Mario Rossi", "Pagato a: Bar Centrale", "Destinatario Esselunga" — il beneficiario
// di un pagamento digitale conta più della prima riga di testo (che è spesso l'header dell'app).
const RECIPIENT_LINE = /(?:inviato a|pagato a|destinatario|beneficiario|ricevuto da|sent to|paid to|a:)\s*[:\-]?\s*(.+)/i
// Formato ISO (AAAA-MM-GG), comune in screenshot/ricevute digitali: controllato prima del
// pattern generico GG/MM/AA per evitare di scambiare l'ordine dei campi.
const ISO_DATE_PATTERN = /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/
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
// Non ancorata all'inizio riga: molti scontrini scrivono l'indirizzo dopo un'etichetta
// ("Sede: Via Roma 12") o preceduto da altro testo scansionato sulla stessa riga.
const ADDRESS_WORD = /\b(via|viale|v\.le|corso|c\.so|piazza|p\.zza|largo|vicolo|strada|contrada|street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|boulevard|blvd\.|drive|dr\.)\s+\S.*/i
const ADDRESS_LINE = new RegExp(`^${ADDRESS_WORD.source}`, 'i')
// Riga successiva a un indirizzo che sembra un CAP + città ("20100 Milano (MI)"): va
// accodata per avere un indirizzo completo invece che solo il nome della via.
const CITY_LINE = /^\d{4,6}\s+[a-zà-ÿ]/i
const PHONE_LINE = /(?:tel|phone|ph|mobile|cell|contact)\.?\s*[:\-]?\s*(\+?\d[\d\s\/\-]{6,15}\d)/i
// Partita IVA: numero di 11 cifre, spesso con prefisso "IT" e/o cifre separate da spazi
// nell'OCR ("P.IVA IT 012 345 6789"). Accetta anche solo "IVA" o "Partita IVA" come etichetta.
const VAT_LINE = /(?:p\.?\s*iva|partita\s+iva|iva)\s*[:\-]?\s*(?:it)?\s*((?:\d[\s.]?){11})/i
const CF_LINE = /c\.?\s?f\.?\s*[:\-]?\s*([A-Z0-9]{11,16})/i
// Quantità davanti o dietro al nome della voce: "2x Pane", "2 X Pane", "Pane x2", "Pane X 3".
const QTY_PREFIX = /^(\d{1,3})\s*[x×]\s*(.+)/i
const QTY_SUFFIX = /(.+?)\s*[x×]\s*(\d{1,3})$/i

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
  // Costruita a mano dai numeri letti sullo scontrino, non da toISOString(): quella
  // passa per l'UTC e con un fuso avanti (es. Italia) la data letta scivola indietro
  // di un giorno.
  return toLocalDateKey(date)
}

// Estrae negozio/beneficiario, data, totale e voci dal testo grezzo OCR con euristiche su
// posizione e pattern — valide sia per scontrini cartacei sia per screenshot di pagamenti
// digitali (PayPal, Satispay, bonifici, app bancarie), che non hanno una riga "TOTALE" esplicita.
// `ocrLines` (opzionale) sono le righe con bounding box di Tesseract (`data.lines`): usate per
// individuare il logo/nome negozio, di solito il testo più alto tra le prime righe scansionate.
export function parseReceiptText(rawText, ocrLines = []) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  function lineHeight(text) {
    const found = ocrLines.find((l) => l.text && l.text.trim() === text)
    return found?.bbox ? found.bbox.y1 - found.bbox.y0 : 0
  }

  const recipientLine = lines.map((l) => l.match(RECIPIENT_LINE)).find(Boolean)
  let merchant
  if (recipientLine) {
    merchant = recipientLine[1]
  } else {
    const candidates = lines
      .slice(0, 8)
      .filter((l) => !NOISE_LINE.test(l) && !ADDRESS_LINE.test(l) && !PHONE_LINE.test(l) && !VAT_LINE.test(l) && !/^\d+$/.test(l) && l.length > 2)
    // Tra le prime righe utili, quella scritta più in grande è di solito il logo/nome
    // dell'esercente. Senza bounding box (o tutte uguali) resta la prima, come prima.
    merchant = candidates.reduce((best, l) => (lineHeight(l) > lineHeight(best) ? l : best), candidates[0] || '')
  }
  merchant = merchant.replace(/\s{2,}/g, ' ').replace(/[.\-*€\d\s]+$/, '').trim().slice(0, 40)

  let date = null
  for (const line of lines) {
    const im = line.match(ISO_DATE_PATTERN)
    if (im) { date = toIsoDate(im[3], Number(im[2]) - 1, im[1]); if (date) break }
    const m = line.match(DATE_PATTERN)
    if (m) { date = toIsoDate(m[1], Number(m[2]) - 1, m[3]); if (date) break }
    const lm = line.match(LONG_DATE_PATTERN)
    if (lm) { date = toIsoDate(lm[1], MONTHS_IT[lm[2].toLowerCase()], lm[3]); if (date) break }
  }

  let total = null
  let totalSource = 'manualOverride'
  // Non ci si ferma alla prima riga con "totale/importo/...": si scansiona tutto il
  // documento e vince l'ULTIMA riga che matcha, perché il totale finale (quello che
  // interessa) è quasi sempre l'ultima etichetta di questo tipo prima della fine dello
  // scontrino/fattura — righe precedenti possono essere subtotali, imponibile, ecc.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!TOTAL_KEYWORD.test(line)) continue
    let matches = [...line.matchAll(AMOUNT_ON_LINE)]
    // Etichetta e importo a volte finiscono su righe OCR separate (layout a colonne,
    // tipico delle fatture): se la riga con "totale" non ha un importo, si guarda
    // quella subito dopo prima di rinunciare.
    if (!matches.length && lines[i + 1]) matches = [...lines[i + 1].matchAll(AMOUNT_ON_LINE)]
    if (matches.length) {
      total = toNumber(matches[matches.length - 1].groups.amount)
      totalSource = 'ocrDetected'
    }
  }

  // Dettagli anagrafici dell'esercente, quando lo scontrino li riporta (non tutti i formati
  // digitali/screenshot li hanno): indirizzo, telefono, partita IVA o codice fiscale.
  let address = null
  let phone = null
  let vat = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!address) {
      const m = line.match(ADDRESS_WORD)
      if (m) {
        let full = line.slice(m.index)
        // Riga successiva con CAP + città: fa parte dello stesso indirizzo.
        if (lines[i + 1] && CITY_LINE.test(lines[i + 1])) full += `, ${lines[i + 1]}`
        address = full.replace(/\s{2,}/g, ' ').trim().slice(0, 80)
      }
    }
    if (!phone) {
      const m = line.match(PHONE_LINE)
      if (m) phone = m[1].replace(/\s{2,}/g, ' ').trim()
    }
    if (!vat) {
      const m = line.match(VAT_LINE)
      if (m) vat = m[1].replace(/[\s.]/g, '')
      else {
        const cf = line.match(CF_LINE)
        if (cf) vat = cf[1].toUpperCase()
      }
    }
  }

  const items = []
  for (const line of lines) {
    if (TOTAL_KEYWORD.test(line) || NOISE_LINE.test(line) || STANDALONE_AMOUNT.test(line)) continue
    const m = line.match(PRICE_AT_END)
    if (!m) continue
    const amount = toNumber(m.groups.amount)
    let name = line.slice(0, m.index).trim().replace(/[.\-*]+$/, '').trim()
    let qty = 1
    const qtyPrefix = name.match(QTY_PREFIX)
    if (qtyPrefix) {
      qty = Number(qtyPrefix[1])
      name = qtyPrefix[2].trim()
    } else {
      const qtySuffix = name.match(QTY_SUFFIX)
      if (qtySuffix) {
        qty = Number(qtySuffix[2])
        name = qtySuffix[1].trim()
      }
    }
    if (name && amount > 0 && amount < 1000) items.push({ name: name.slice(0, 40), amount, qty: qty > 0 && qty < 100 ? qty : 1 })
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
    date: date || toLocalDateKey(),
    total,
    totalSource,
    items,
    address: address || '',
    phone: phone || '',
    vat: vat || '',
    ocrRawText: rawText,
  }
}
