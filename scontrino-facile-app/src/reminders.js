import { useCallback } from 'react'
import { useIdbState } from './utils/idb'

const STORAGE_KEY = 'scontrino_facile_reminders'
const IDB_KEY = 'reminders'

function createId() {
  return `rem_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export function useReminders() {
  // IndexedDB invece di localStorage (stesso motivo di state.js/idb.js), con migrazione
  // una tantum di eventuali promemoria ancora nel vecchio localStorage.
  const [reminders, update] = useIdbState(IDB_KEY, [], { legacyKey: STORAGE_KEY })

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
