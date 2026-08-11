import { isQuotaError, reportStorageError } from './storageAlert'
import { idbGet, idbSet } from './idb'

const PIN_KEY = 'scontrino_facile_vault_pin'
const LEGACY_KEY = 'scontrino_facile_vault' // vecchio formato unico: { pinHash, documents }
const IDB_DOCS_KEY = 'vault_documents'

// Il codice PIN resta su localStorage: è un valore minuscolo (una stringa hash), e
// tenerlo lì permette a isVaultSetUp() di restare una lettura sincrona istantanea, come
// serve nello useState iniziale di VaultLock.jsx. I documenti invece (spesso PDF/immagini
// pesanti) vanno su IndexedDB — stesso motivo di state.js/idb.js, e sono la parte che
// riempie davvero lo spazio.
function loadPinHash() {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // dato corrotto o storage non disponibile
  }
  // Migrazione dal vecchio formato unico, se presente.
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw)
      if (legacy.pinHash) {
        localStorage.setItem(PIN_KEY, JSON.stringify(legacy.pinHash))
        return legacy.pinHash
      }
    }
  } catch {
    // dato corrotto o storage non disponibile
  }
  return null
}

function savePinHash(hash) {
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify(hash))
  } catch (err) {
    if (isQuotaError(err)) reportStorageError()
  }
}

export async function loadVaultDocuments() {
  try {
    const fromIdb = await idbGet(IDB_DOCS_KEY)
    if (fromIdb) return fromIdb
  } catch {
    // IndexedDB non disponibile: si prova comunque la migrazione da localStorage sotto.
  }
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw)
      if (legacy.documents?.length) {
        idbSet(IDB_DOCS_KEY, legacy.documents).catch(() => {})
        return legacy.documents
      }
    }
  } catch {
    // dato corrotto o storage non disponibile
  }
  return []
}

export function saveVaultDocuments(documents) {
  idbSet(IDB_DOCS_KEY, documents).catch((err) => {
    if (isQuotaError(err)) reportStorageError()
  })
}

async function hashPin(pin) {
  const data = new TextEncoder().encode(`scontrino-facile-vault:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function isVaultSetUp() {
  return !!loadPinHash()
}

export async function setupVaultPin(pin) {
  savePinHash(await hashPin(pin))
}

export async function verifyVaultPin(pin) {
  const hash = loadPinHash()
  if (!hash) return false
  return (await hashPin(pin)) === hash
}

// Cambia il codice solo dopo aver verificato quello attuale. Restituisce false (senza
// toccare nulla) se il codice attuale inserito è sbagliato.
export async function changeVaultPin(currentPin, newPin) {
  const ok = await verifyVaultPin(currentPin)
  if (!ok) return false
  await setupVaultPin(newPin)
  return true
}

// Cancella codice e tutti i documenti. Distruttivo per design: va usato solo dopo
// conferma esplicita dell'utente (es. "codice dimenticato").
export function resetVault() {
  savePinHash(null)
  saveVaultDocuments([])
}
