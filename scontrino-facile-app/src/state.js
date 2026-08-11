import { useCallback, useEffect, useState } from 'react'
import { guessCategory, normalizeMerchant } from './categories'
import { fromLocalDateKey, toLocalDateKey } from './utils/format'
import { isQuotaError, reportStorageError } from './utils/storageAlert'
import { idbGet, idbSet } from './utils/idb'

const STORAGE_KEY = 'scontrino_facile_state'
const IDB_KEY = 'state'
const EMPTY_STATE = { receipts: [], merchantCategoryMap: {} }

function createId() {
  return `r_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

// IndexedDB invece di localStorage (vedi idb.js per il perché). Al primo avvio dopo
// questo cambio, se IndexedDB è vuoto ma il vecchio localStorage ha ancora dati da prima,
// li migra invece di farli sparire.
async function loadState() {
  try {
    const fromIdb = await idbGet(IDB_KEY)
    if (fromIdb) return fromIdb
  } catch {
    // IndexedDB non disponibile: si prova comunque la migrazione da localStorage sotto.
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const migrated = JSON.parse(raw)
      idbSet(IDB_KEY, migrated).catch(() => {})
      return migrated
    }
  } catch {
    // localStorage non disponibile o dato corrotto: si riparte da zero.
  }
  // Niente più dati demo qui: erano pensati come esempio al primissimo avvio, ma un
  // ripiego vuoto era troppo facile da scambiare per i propri scontrini spariti — ed è
  // finito più volte in un backup esportato per errore, che poi li reimportava sopra ai
  // dati veri. Meglio una lista vuota onesta: se non c'è niente, si vede che non c'è niente.
  return EMPTY_STATE
}

function saveState(state) {
  idbSet(IDB_KEY, state).catch((err) => {
    // spazio esaurito o IndexedDB non disponibile: la sessione continua solo in memoria.
    if (isQuotaError(err)) reportStorageError()
  })
}

export function useReceipts() {
  const [state, setState] = useState(EMPTY_STATE)

  useEffect(() => {
    let cancelled = false
    loadState().then((loaded) => { if (!cancelled) setState(loaded) })
    return () => { cancelled = true }
  }, [])

  // La scrittura su IndexedDB è per natura asincrona (a differenza di localStorage.setItem,
  // che era sincrono mentre restava comunque a rischio di perdita — vedi idb.js): qui
  // dentro la funzione di aggiornamento di setState, così parte nello stesso istante
  // dell'azione dell'utente invece che in un effect separato rimandato dopo il render.
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
