import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { downloadJson, parseBackup, serializeBackup } from '../utils/backup'
import { disableLock, isBiometricSupported, isLockEnabled, registerBiometric } from '../utils/auth'
import { changeVaultPin, isVaultSetUp } from '../utils/vault'
import { toLocalDateKey } from '../utils/format'

function bytesToKb(n) {
  return (n / 1024).toFixed(1)
}

// Diagnostica visibile per il problema più insistito di questa app: dati che sembrano
// non restare salvati da icona installata su iOS. Invece di continuare a indovinare
// aggiustamenti alla cieca, questo mostra dati reali dal dispositivo dell'utente —
// quanto storage è davvero occupato, se il browser ha concesso la persistenza.
function useStorageDiagnostics() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      let persisted = null
      try { persisted = (await navigator.storage?.persisted?.()) ?? null } catch { /* non supportato */ }
      let estimate = null
      try { estimate = (await navigator.storage?.estimate?.()) ?? null } catch { /* non supportato */ }
      let localStorageBytes = 0
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          localStorageBytes += (key?.length || 0) + (localStorage.getItem(key)?.length || 0)
        }
      } catch { /* localStorage non disponibile */ }
      // Test di scrittura diretto: 0.0 KB usati con scontrini già presenti a schermo
      // vuol dire che localStorage.setItem sta fallendo SEMPRE, non solo per spazio
      // esaurito (altrimenti l'avviso apposito sarebbe già scattato) — qui si vede
      // l'errore esatto invece di continuare a dedurlo dai sintomi.
      let writeTest = null
      try {
        const testKey = '__scontrino_facile_write_test__'
        localStorage.setItem(testKey, '1')
        const readBack = localStorage.getItem(testKey)
        localStorage.removeItem(testKey)
        writeTest = readBack === '1' ? { ok: true } : { ok: false, error: 'scritto ma non riletto correttamente' }
      } catch (err) {
        writeTest = { ok: false, error: `${err.name || 'Errore'}: ${err.message || String(err)}` }
      }
      if (!cancelled) setInfo({ persisted, estimate, localStorageBytes, writeTest })
    }
    run()
    return () => { cancelled = true }
  }, [])

  return info
}

export default function Settings({ receipts, merchantCategoryMap, onRestore, onClose }) {
  const storageInfo = useStorageDiagnostics()
  const [lockOn, setLockOn] = useState(isLockEnabled)
  const [lockError, setLockError] = useState('')
  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState('')

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')
  const [pinBusy, setPinBusy] = useState(false)

  function exportBackup() {
    const json = serializeBackup(receipts, merchantCategoryMap)
    downloadJson(`scontrinofacile-backup-${toLocalDateKey()}.json`, json)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const { receipts: importedReceipts, merchantCategoryMap: importedMap } = parseBackup(text)
      const ok = window.confirm(
        `Ripristinare questo backup sostituirà tutte le ${receipts.length} ricevute attuali con le ${importedReceipts.length} del file. Continuare?`,
      )
      if (ok) onRestore(importedReceipts, importedMap)
    } catch (err) {
      setImportError(err.message || 'Backup non valido.')
    }
  }

  async function toggleLock() {
    setLockError('')
    if (lockOn) {
      disableLock()
      setLockOn(false)
      return
    }
    try {
      await registerBiometric()
      setLockOn(true)
    } catch {
      setLockError('Non sono riuscito ad attivare Face ID su questo dispositivo.')
    }
  }

  async function submitPinChange(e) {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')
    if (newPin.length !== 4) { setPinError('Il nuovo codice deve avere 4 cifre.'); return }
    if (newPin !== confirmPin) { setPinError('I due nuovi codici non coincidono.'); return }
    setPinBusy(true)
    const ok = await changeVaultPin(currentPin, newPin)
    setPinBusy(false)
    if (ok) {
      setPinSuccess('Codice aggiornato.')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } else {
      setPinError('Codice attuale errato.')
    }
  }

  return (
    <div className="screen">
      <div className="pad dash-head" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 18px)' }}>
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> Indietro</button>
      </div>
      <div className="pad">
        <h1 className="scr-title">Impostazioni</h1>
        <p className="backup-hint" style={{ marginTop: 4 }}>
          Versione app: {new Date(__BUILD_TIME__).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="pad backup-block">
        <p className="sect-label">Diagnostica archiviazione</p>
        <p className="backup-hint">
          {receipts.length} {receipts.length === 1 ? 'ricevuta' : 'ricevute'} salvate
          {storageInfo && ` · ${bytesToKb(storageInfo.localStorageBytes)} KB usati su questo dispositivo`}
        </p>
        <p className="backup-hint">
          Archiviazione persistente: {storageInfo == null
            ? '…'
            : storageInfo.persisted == null
              ? 'non supportata da questo browser'
              : storageInfo.persisted ? 'attiva' : 'non concessa dal browser'}
        </p>
        {storageInfo?.estimate?.quota != null && (
          <p className="backup-hint">
            Spazio totale stimato dal browser: {bytesToKb(storageInfo.estimate.usage || 0)} KB su {Math.round(storageInfo.estimate.quota / 1024 / 1024)} MB disponibili
          </p>
        )}
        {storageInfo?.writeTest && (
          <p className={storageInfo.writeTest.ok ? 'backup-hint' : 'notice'}>
            Test di scrittura: {storageInfo.writeTest.ok ? 'riuscito' : `fallito — ${storageInfo.writeTest.error}`}
          </p>
        )}
      </div>

      <div className="pad backup-block">
        <p className="sect-label">Backup dati</p>
        <p className="backup-hint">I dati restano solo su questo dispositivo. Esporta un backup ogni tanto per non perderli.</p>
        <div className="backup-actions">
          <button className="btn" onClick={exportBackup} disabled={receipts.length === 0}>
            <Icon name="Download" size={15} /> Esporta backup
          </button>
          <label className="btn">
            <Icon name="Upload" size={15} /> Importa backup
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} hidden />
          </label>
        </div>
        {importError && <p className="notice">{importError}</p>}
      </div>

      {isBiometricSupported() && (
        <div className="pad backup-block">
          <p className="sect-label">Sicurezza</p>
          <p className="backup-hint">Richiedi Face ID (o lo sblocco biometrico del dispositivo) ogni volta che apri l'app.</p>
          <button className="btn" onClick={toggleLock}>
            <Icon name="ScanFace" size={15} /> {lockOn ? 'Disattiva Face ID' : 'Attiva Face ID'}
          </button>
          {lockError && <p className="notice">{lockError}</p>}
        </div>
      )}

      {isVaultSetUp() && (
        <div className="pad backup-block">
          <p className="sect-label">Codice documenti</p>
          <p className="backup-hint">Cambia il codice a 4 cifre che protegge i tuoi documenti.</p>
          <form onSubmit={submitPinChange} className="pin-change-form">
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Codice attuale"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Nuovo codice"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Conferma nuovo codice"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            />
            {pinError && <p className="vault-lock-error">{pinError}</p>}
            {pinSuccess && <p className="notice">{pinSuccess}</p>}
            <button className="btn" type="submit" disabled={pinBusy}>Aggiorna codice</button>
          </form>
        </div>
      )}
    </div>
  )
}
