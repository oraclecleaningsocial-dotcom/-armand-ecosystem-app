import { useCallback, useEffect, useState } from 'react'
import { isQuotaError, reportStorageError } from './utils/storageAlert'
import { idbGet, idbSet } from './utils/idb'

const STORAGE_KEY = 'scontrino_facile_reminders'
const IDB_KEY = 'reminders'

function createId() {
  return `rem_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

// IndexedDB invece di localStorage (stesso motivo di state.js/idb.js), con migrazione
// una tantum di eventuali promemoria ancora nel vecchio localStorage.
async function loadReminders() {
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
    // dato corrotto o storage non disponibile: si riparte da una lista vuota
  }
  return []
}

function saveReminders(reminders) {
  idbSet(IDB_KEY, reminders).catch((err) => {
    if (isQuotaError(err)) reportStorageError()
  })
}

export function useReminders() {
  const [reminders, setReminders] = useState([])

  useEffect(() => {
    let cancelled = false
    loadReminders().then((loaded) => { if (!cancelled) setReminders(loaded) })
    return () => { cancelled = true }
  }, [])

  // Salva dentro la stessa chiamata che aggiorna lo stato React (vedi state.js per la
  // spiegazione completa): un'app da schermata Home su iOS può essere terminata dal
  // sistema pochi istanti dopo l'ultima azione, prima che un eventuale effect separato
  // abbia il tempo di scattare.
  const update = useCallback((updater) => {
    setReminders((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveReminders(next)
      return next
    })
  }, [])

  const addReminder = useCallback((draft) => {
    const reminder = {
      id: createId(),
      date: draft.date,
      title: draft.title || 'Promemoria',
      note: draft.note || '',
      createdAt: new Date().toISOString(),
    }
    update((prev) => [reminder, ...prev])
    return reminder
  }, [update])

  const deleteReminder = useCallback((id) => {
    update((prev) => prev.filter((r) => r.id !== id))
  }, [update])

  return { reminders, addReminder, deleteReminder }
}
