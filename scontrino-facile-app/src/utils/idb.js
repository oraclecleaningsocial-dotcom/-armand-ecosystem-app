import { useCallback, useEffect, useRef, useState } from 'react'
import { isQuotaError, reportStorageError } from './storageAlert'

// IndexedDB invece di localStorage per gli scontrini: sul dispositivo dell'utente, un
// test di scrittura su localStorage riesce e l'archiviazione persistente risulta concessa,
// eppure i dati non sopravvivono comunque alla chiusura completa dell'app da icona su
// iOS — un comportamento che punta a come Safari gestisce lo storage delle app standalone
// più che a un errore rilevabile lato JS. IndexedDB è il meccanismo che i browser trattano
// con le garanzie di persistenza più forti; non è garantito risolva il problema, ma è la
// leva concreta rimasta da provare dopo aver escluso tutto il resto (quota, tempi di
// salvataggio, dati demo).
const DB_NAME = 'scontrino_facile_db'
const STORE_NAME = 'kv'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet(key) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function idbSet(key, value) {
  const db = await openDb()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

// Hook condiviso da tutti i moduli che tengono dati in IndexedDB (scontrini, promemoria,
// note, to-do, documenti del Vault, prodotti): carica il valore in un effect asincrono al
// mount e restituisce [value, update]. update(updater) è sicura da chiamare anche prima
// che il caricamento iniziale sia finito — un caso raro ma possibile (l'utente digita e
// conferma un'aggiunta nell'istante stesso in cui il widget compare) che altrimenti
// causerebbe una "lost update": l'update calcolerebbe il prossimo valore partendo dal
// defaultValue (non ancora sostituito dai dati veri), lo salverebbe su IndexedDB
// sovrascrivendo quanto già persistito, e poco dopo il caricamento in corso
// risistemerebbe lo stato React con i vecchi dati, facendo sparire l'aggiunta appena
// fatta dall'interfaccia. Qui invece ogni update chiamata prima del caricamento viene
// applicata subito in modo ottimistico (l'utente vede il risultato all'istante) e messa
// in coda; quando il caricamento vero finisce, la coda viene "rigiocata" sopra ai dati
// reali appena letti, cosicché lo stato finale e il salvataggio riflettano sia lo storico
// persistito sia le modifiche fatte nel frattempo.
export function useIdbState(idbKey, defaultValue, { legacyKey, migrateLegacy } = {}) {
  const [value, setValue] = useState(defaultValue)
  const loadedRef = useRef(false)
  const queueRef = useRef([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const fromIdb = await idbGet(idbKey)
        if (fromIdb) return fromIdb
      } catch {
        // IndexedDB non disponibile: si prova comunque la migrazione da localStorage sotto.
      }
      if (legacyKey) {
        try {
          const raw = localStorage.getItem(legacyKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            const migrated = migrateLegacy ? migrateLegacy(parsed) : parsed
            if (migrated) {
              idbSet(idbKey, migrated).catch(() => {})
              return migrated
            }
          }
        } catch {
          // dato corrotto o storage non disponibile
        }
      }
      return defaultValue
    }

    load().then((loaded) => {
      if (cancelled) return
      const queued = queueRef.current
      queueRef.current = []
      loadedRef.current = true
      const final = queued.reduce((acc, updater) => (typeof updater === 'function' ? updater(acc) : updater), loaded)
      setValue(final)
      if (queued.length) {
        idbSet(idbKey, final).catch((err) => {
          if (isQuotaError(err)) reportStorageError()
        })
      }
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idbKey])

  const update = useCallback((updater) => {
    if (!loadedRef.current) queueRef.current.push(updater)
    setValue((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (loadedRef.current) {
        idbSet(idbKey, next).catch((err) => {
          if (isQuotaError(err)) reportStorageError()
        })
      }
      return next
    })
  }, [idbKey])

  return [value, update]
}
