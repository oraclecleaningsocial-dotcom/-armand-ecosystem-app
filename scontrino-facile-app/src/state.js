import { useCallback, useState } from 'react'
import { guessCategory, normalizeMerchant } from './categories'
import { fromLocalDateKey, toLocalDateKey } from './utils/format'
import { isQuotaError, reportStorageError } from './utils/storageAlert'

const STORAGE_KEY = 'scontrino_facile_state'

function createId() {
  return `r_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // localStorage non disponibile o dato corrotto: si riparte da zero.
  }
  // Niente più dati demo qui: erano pensati come esempio al primissimo avvio, ma un
  // ripiego vuoto era troppo facile da scambiare per i propri scontrini spariti — ed è
  // finito più volte in un backup esportato per errore, che poi li reimportava sopra ai
  // dati veri. Meglio una lista vuota onesta: se non c'è niente, si vede che non c'è niente.
  return { receipts: [], merchantCategoryMap: {} }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    // storage pieno o non disponibile: la sessione continua solo in memoria. Se è per
    // spazio esaurito lo segnaliamo, invece di lasciare che l'utente scopra dati mancanti
    // solo alla riapertura dell'app.
    if (isQuotaError(err)) reportStorageError()
  }
}

export function useReceipts() {
  const [state, setState] = useState(loadState)

  // Salva in modo sincrono, dentro la stessa chiamata che aggiorna lo stato React,
  // invece di un useEffect separato che scatta dopo il render. Un'app da schermata Home
  // su iOS può essere terminata dal sistema pochi istanti dopo l'ultima azione (swipe per
  // chiuderla): se il salvataggio fosse ancora "in coda" in un effect non ancora eseguito
  // in quel momento, andrebbe perso — l'azione dell'utente sarebbe visibile a schermo ma
  // mai scritta su disco. Chiamare saveState dentro la funzione di aggiornamento di
  // setState lo rende parte della stessa chiamata sincrona che ha scatenato la modifica.
  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveState(next)
      return next
    })
  }, [])

  const addReceipt = useCallback((draft) => {
    const receipt = {
      id: createId(),
      merchant: draft.merchant || 'Esercente sconosciuto',
      date: draft.date || toLocalDateKey(),
      total: Number(draft.total) || 0,
      totalSource: draft.totalSource || 'manualOverride',
      category: draft.category || 'altro',
      items: draft.items || [],
      address: draft.address || '',
      phone: draft.phone || '',
      vat: draft.vat || '',
      note: draft.note || '',
      imageDataUrl: draft.imageDataUrl || null,
      ocrRawText: draft.ocrRawText || '',
      sourceType: draft.sourceType || 'foto',
      createdAt: new Date().toISOString(),
    }
    update((prev) => ({
      ...prev,
      receipts: [receipt, ...prev.receipts],
      merchantCategoryMap: {
        ...prev.merchantCategoryMap,
        [normalizeMerchant(receipt.merchant)]: receipt.category,
      },
    }))
    return receipt
  }, [update])

  const updateReceipt = useCallback((id, patch) => {
    update((prev) => {
      const receipts = prev.receipts.map((r) => (r.id === id ? { ...r, ...patch } : r))
      const changed = receipts.find((r) => r.id === id)
      const merchantCategoryMap = changed
        ? { ...prev.merchantCategoryMap, [normalizeMerchant(changed.merchant)]: changed.category }
        : prev.merchantCategoryMap
      return { ...prev, receipts, merchantCategoryMap }
    })
  }, [update])

  const deleteReceipt = useCallback((id) => {
    update((prev) => ({ ...prev, receipts: prev.receipts.filter((r) => r.id !== id) }))
  }, [update])

  const categorize = useCallback(
    (merchantName, itemNames) => guessCategory(merchantName, state.merchantCategoryMap, itemNames),
    [state.merchantCategoryMap],
  )

  // Sostituisce tutti i dati (usato dal ripristino di un backup). Distruttivo per design:
  // chi chiama questa funzione deve aver già chiesto conferma all'utente.
  const replaceAll = useCallback((receipts, merchantCategoryMap) => {
    update({ receipts, merchantCategoryMap: merchantCategoryMap || {} })
  }, [update])

  return {
    receipts: state.receipts,
    merchantCategoryMap: state.merchantCategoryMap,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    categorize,
    replaceAll,
  }
}

export function totalsByPeriod(receipts, { year, month }) {
  const inPeriod = receipts.filter((r) => {
    const d = fromLocalDateKey(r.date)
    return d.getFullYear() === year && (month == null || d.getMonth() === month)
  })
  const total = inPeriod.reduce((s, r) => s + r.total, 0)
  const byCategory = {}
  for (const r of inPeriod) {
    byCategory[r.category] = (byCategory[r.category] || 0) + r.total
  }
  return { total, byCategory, count: inPeriod.length, receipts: inPeriod }
}

export function last6MonthsTrend(receipts) {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('it-IT', { month: 'short' }) })
  }
  return months.map((m) => ({ ...m, total: totalsByPeriod(receipts, m).total }))
}
