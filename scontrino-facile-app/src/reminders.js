import { useCallback, useEffect, useRef, useState } from 'react'
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
  // Vedi state.js per il perché: non salvare al primissimo mount, solo dalle mutazioni
  // vere, evita di sovrascrivere dati reali con un ripiego vuoto se la primissima lettura
  // in un'app standalone appena riavviata trova lo storage non ancora pronto.
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    saveReminders(reminders)
  }, [reminders])

  const addReminder = useCallback((draft) => {
    const reminder = {
      id: createId(),
      date: draft.date,
      title: draft.title || 'Promemoria',
      note: draft.note || '',
      createdAt: new Date().toISOString(),
    }
    setReminders((prev) => [reminder, ...prev])
    return reminder
  }, [])

  const deleteReminder = useCallback((id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { reminders, addReminder, deleteReminder }
}
