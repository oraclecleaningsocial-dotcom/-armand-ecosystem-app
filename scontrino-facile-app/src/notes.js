import { useCallback } from 'react'
import { useIdbState } from './utils/idb'

const STORAGE_KEY = 'scontrino_facile_notes'
const IDB_KEY = 'notes'

function createId() {
  return `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export function useNotes() {
  // IndexedDB invece di localStorage (stesso motivo di state.js/idb.js), con migrazione
  // una tantum di eventuali note ancora nel vecchio localStorage.
  const [notes, update] = useIdbState(IDB_KEY, [], { legacyKey: STORAGE_KEY })

  const addNote = useCallback((text) => {
    const note = { id: createId(), text, createdAt: new Date().toISOString() }
    update((prev) => [note, ...prev])
    return note
  }, [update])

  const deleteNote = useCallback((id) => {
    update((prev) => prev.filter((n) => n.id !== id))
  }, [update])

  return { notes, addNote, deleteNote }
}
