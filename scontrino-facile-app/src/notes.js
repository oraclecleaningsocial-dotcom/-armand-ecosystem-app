import { useCallback, useEffect, useState } from 'react'
import { isQuotaError, reportStorageError } from './utils/storageAlert'
import { idbGet, idbSet } from './utils/idb'

const STORAGE_KEY = 'scontrino_facile_notes'
const IDB_KEY = 'notes'

function createId() {
  return `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

// IndexedDB invece di localStorage (stesso motivo di state.js/idb.js), con migrazione
// una tantum di eventuali note ancora nel vecchio localStorage.
async function loadNotes() {
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

function saveNotes(notes) {
  idbSet(IDB_KEY, notes).catch((err) => {
    if (isQuotaError(err)) reportStorageError()
  })
}

export function useNotes() {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    let cancelled = false
    loadNotes().then((loaded) => { if (!cancelled) setNotes(loaded) })
    return () => { cancelled = true }
  }, [])

  // Salva dentro la stessa chiamata che aggiorna lo stato React (vedi state.js per la
  // spiegazione completa): un'app da schermata Home su iOS può essere terminata dal
  // sistema pochi istanti dopo l'ultima azione, prima che un eventuale effect separato
  // abbia il tempo di scattare.
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
