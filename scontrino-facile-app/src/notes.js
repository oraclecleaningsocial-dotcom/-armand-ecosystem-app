import { useCallback, useEffect, useState } from 'react'
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

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const addNote = useCallback((text) => {
    const note = { id: createId(), text, createdAt: new Date().toISOString() }
    setNotes((prev) => [note, ...prev])
    return note
  }, [])

  const deleteNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notes, addNote, deleteNote }
}
