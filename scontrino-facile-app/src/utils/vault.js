import { isQuotaError, reportStorageError } from './storageAlert'

const STORAGE_KEY = 'scontrino_facile_vault'

function loadVault() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // dato corrotto o storage non disponibile: si riparte da un vault vuoto
  }
  return { pinHash: null, documents: [] }
}

function saveVault(vault) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault))
  } catch (err) {
    // storage pieno o non disponibile: la sessione continua solo in memoria. I documenti
    // (PDF/immagini) sono ciò che più facilmente esaurisce lo spazio, quindi qui l'avviso
    // conta particolarmente.
    if (isQuotaError(err)) reportStorageError()
  }
}

async function hashPin(pin) {
  const data = new TextEncoder().encode(`scontrino-facile-vault:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function isVaultSetUp() {
  return !!loadVault().pinHash
}

export async function setupVaultPin(pin) {
  const vault = loadVault()
  vault.pinHash = await hashPin(pin)
  saveVault(vault)
}

export async function verifyVaultPin(pin) {
  const vault = loadVault()
  if (!vault.pinHash) return false
  return (await hashPin(pin)) === vault.pinHash
}

// Cambia il codice solo dopo aver verificato quello attuale. Restituisce false (senza
// toccare nulla) se il codice attuale inserito è sbagliato.
export async function changeVaultPin(currentPin, newPin) {
  const ok = await verifyVaultPin(currentPin)
  if (!ok) return false
  await setupVaultPin(newPin)
  return true
}

export function getDocuments() {
  return loadVault().documents
}

export function addDocument(doc) {
  const vault = loadVault()
  const document = {
    id: `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    ...doc,
    createdAt: new Date().toISOString(),
  }
  vault.documents = [document, ...vault.documents]
  saveVault(vault)
  return document
}

export function updateDocument(id, patch) {
  const vault = loadVault()
  vault.documents = vault.documents.map((d) => (d.id === id ? { ...d, ...patch } : d))
  saveVault(vault)
  return vault.documents.find((d) => d.id === id)
}

export function deleteDocument(id) {
  const vault = loadVault()
  vault.documents = vault.documents.filter((d) => d.id !== id)
  saveVault(vault)
}

// Cancella codice e tutti i documenti. Distruttivo per design: va usato solo dopo
// conferma esplicita dell'utente (es. "codice dimenticato").
export function resetVault() {
  saveVault({ pinHash: null, documents: [] })
}
