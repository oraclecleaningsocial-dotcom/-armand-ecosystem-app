import { useCallback, useState } from 'react'
import { isQuotaError, reportStorageError } from './utils/storageAlert'

const STORAGE_KEY = 'scontrino_facile_reminders'

function createId() {
  return `rem_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function loadReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // dato corrotto o storage non disponibile: si riparte da una lista vuota
  }
  return []
}

function saveReminders(reminders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
  } catch (err) {
    if (isQuotaError(err)) reportStorageError()
  }
}

export function useReminders() {
  const [reminders, setReminders] = useState(loadReminders)

  // Salva in modo sincrono, dentro la stessa chiamata che aggiorna lo stato React
  // (vedi state.js per la spiegazione completa): un'app da schermata Home su iOS può
  // essere terminata dal sistema pochi istanti dopo l'ultima azione, prima che un
  // eventuale useEffect separato abbia il tempo di scattare.
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
