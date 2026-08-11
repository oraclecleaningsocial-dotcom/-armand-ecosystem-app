import { useCallback, useState } from 'react'
import { isQuotaError, reportStorageError } from './utils/storageAlert'

const STORAGE_KEY = 'scontrino_facile_notes'

function createId() {
  return `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // dato corrotto o storage non disponibile: si riparte da una lista vuota
  }
  return []
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (err) {
    if (isQuotaError(err)) reportStorageError()
  }
}

export function useNotes() {
  const [notes, setNotes] = useState(loadNotes)

  // Salva in modo sincrono, dentro la stessa chiamata che aggiorna lo stato React
  // (vedi state.js per la spiegazione completa): un'app da schermata Home su iOS può
  // essere terminata dal sistema pochi istanti dopo l'ultima azione, prima che un
  // eventuale useEffect separato abbia il tempo di scattare.
  const update = useCallback((updater) => {
    setNotes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveNotes(next)
      return next
    })
  }, [])

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
