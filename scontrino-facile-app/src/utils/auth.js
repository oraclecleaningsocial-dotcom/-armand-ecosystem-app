const CRED_KEY = 'scontrino_facile_cred_id'
const LOCK_KEY = 'scontrino_facile_lock_enabled'

function randomChallenge() {
  return crypto.getRandomValues(new Uint8Array(32))
}

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export function isBiometricSupported() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

export function isLockEnabled() {
  return localStorage.getItem(LOCK_KEY) === '1' && !!localStorage.getItem(CRED_KEY)
}

// Non tocca mai i dati delle ricevute: rimuove solo il blocco, mai `scontrino_facile_state`.
export function disableLock() {
  localStorage.removeItem(LOCK_KEY)
  localStorage.removeItem(CRED_KEY)
}

// Registra un autenticatore della piattaforma (Face ID / Touch ID / impronta) come "chiave" locale.
// Nessun server coinvolto: la credenziale resta nel device, serve solo a richiedere la verifica
// biometrica del sistema operativo prima di mostrare i dati dell'app.
export async function registerBiometric() {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: 'ScontrinoFacile' },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'utente-scontrinofacile',
        displayName: 'ScontrinoFacile',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    },
  })
  localStorage.setItem(CRED_KEY, bufToB64(cred.rawId))
  localStorage.setItem(LOCK_KEY, '1')
}

export async function verifyBiometric() {
  const credId = localStorage.getItem(CRED_KEY)
  if (!credId) throw new Error('Nessun Face ID registrato su questo dispositivo.')
  await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: [{ id: b64ToBuf(credId), type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  })
}
