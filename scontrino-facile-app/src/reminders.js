import { useCallback, useEffect, useState } from 'react'

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
  } catch {
    // storage pieno o non disponibile: la sessione continua solo in memoria
  }
}

export function useReminders() {
  const [reminders, setReminders] = useState(loadReminders)

  useEffect(() => {
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
