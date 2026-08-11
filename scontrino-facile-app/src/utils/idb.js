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
