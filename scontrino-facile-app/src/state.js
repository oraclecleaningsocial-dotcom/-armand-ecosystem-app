import { useCallback, useEffect, useState } from 'react'
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
    // localStorage non disponibile o dato corrotto: si riparte dai dati demo.
  }
  return { receipts: seedReceipts(), merchantCategoryMap: {} }
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

function seedReceipts() {
  return [
    { id: 'seed_1', merchant: 'Esselunga', date: isoDaysAgo(0), total: 34.2, totalSource: 'ocrDetected', category: 'cibo', items: [
      { name: 'Pasta', amount: 2.1 }, { name: 'Latte', amount: 1.8 }, { name: 'Pane', amount: 3.0 }, { name: 'Pomodori', amount: 4.5 },
      { name: 'Detersivo', amount: 6.9 }, { name: 'Caffè', amount: 5.4 }, { name: 'Uova', amount: 3.1 }, { name: 'Formaggio', amount: 7.4 },
    ], note: '', imageDataUrl: null, ocrRawText: '', createdAt: isoDaysAgo(0) },
    { id: 'seed_2', merchant: 'Eni', date: isoDaysAgo(1), total: 60, totalSource: 'ocrDetected', category: 'trasporti', items: [{ name: 'Benzina', amount: 60 }], note: '', imageDataUrl: null, ocrRawText: '', createdAt: isoDaysAgo(1) },
    { id: 'seed_3', merchant: 'Farmacia Centrale', date: isoDaysAgo(2), total: 12.5, totalSource: 'ocrDetected', category: 'salute', items: [{ name: 'Cerotti', amount: 4.5 }, { name: 'Vitamina C', amount: 8.0 }], note: '', imageDataUrl: null, ocrRawText: '', createdAt: isoDaysAgo(2) },
    { id: 'seed_4', merchant: 'Coop', date: isoDaysAgo(3), total: 22.9, totalSource: 'ocrDetected', category: 'cibo', items: [
      { name: 'Pasta', amount: 2.2 }, { name: 'Riso', amount: 3.1 }, { name: 'Olio', amount: 8.9 }, { name: 'Biscotti', amount: 3.5 }, { name: 'Tonno', amount: 5.2 },
    ], note: '', imageDataUrl: null, ocrRawText: '', createdAt: isoDaysAgo(3) },
    { id: 'seed_5', merchant: 'IKEA', date: isoDaysAgo(5), total: 187.4, totalSource: 'ocrDetected', category: 'casa', items: [
      { name: 'Scaffale Kallax', amount: 79.0 }, { name: 'Lampada da tavolo', amount: 24.9 }, { name: 'Cuscini (x2)', amount: 19.0 },
      { name: 'Tende oscuranti', amount: 34.5 }, { name: 'Contenitori', amount: 30.0 },
    ], note: '', imageDataUrl: null, ocrRawText: '', createdAt: isoDaysAgo(5) },
  ]
}

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalDateKey(d)
}

export function useReceipts() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

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
    setState((prev) => ({
      ...prev,
      receipts: [receipt, ...prev.receipts],
      merchantCategoryMap: {
        ...prev.merchantCategoryMap,
        [normalizeMerchant(receipt.merchant)]: receipt.category,
      },
    }))
    return receipt
  }, [])

  const updateReceipt = useCallback((id, patch) => {
    setState((prev) => {
      const receipts = prev.receipts.map((r) => (r.id === id ? { ...r, ...patch } : r))
      const changed = receipts.find((r) => r.id === id)
      const merchantCategoryMap = changed
        ? { ...prev.merchantCategoryMap, [normalizeMerchant(changed.merchant)]: changed.category }
        : prev.merchantCategoryMap
      return { ...prev, receipts, merchantCategoryMap }
    })
  }, [])

  const deleteReceipt = useCallback((id) => {
    setState((prev) => ({ ...prev, receipts: prev.receipts.filter((r) => r.id !== id) }))
  }, [])

  const categorize = useCallback(
    (merchantName, itemNames) => guessCategory(merchantName, state.merchantCategoryMap, itemNames),
    [state.merchantCategoryMap],
  )

  // Sostituisce tutti i dati (usato dal ripristino di un backup). Distruttivo per design:
  // chi chiama questa funzione deve aver già chiesto conferma all'utente.
  const replaceAll = useCallback((receipts, merchantCategoryMap) => {
    setState({ receipts, merchantCategoryMap: merchantCategoryMap || {} })
  }, [])

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
