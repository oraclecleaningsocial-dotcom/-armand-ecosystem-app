import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { downloadJson, parseBackup, serializeBackup } from '../utils/backup'
import { disableLock, isBiometricSupported, isLockEnabled, registerBiometric } from '../utils/auth'
import { changeVaultPin, isVaultSetUp } from '../utils/vault'
import { toLocalDateKey } from '../utils/format'
import { idbGet, idbSet } from '../utils/idb'
import { LANGUAGES, useI18n } from '../i18n'

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
      // Stesso test ma su IndexedDB, che ora è il meccanismo di salvataggio vero e
      // proprio per gli scontrini (vedi state.js/idb.js) — utile capire se anche questo
      // regge o fallisce allo stesso modo di localStorage.
      let idbWriteTest = null
      try {
        const testKey = '__write_test__'
        await idbSet(testKey, 1)
        const readBack = await idbGet(testKey)
        idbWriteTest = readBack === 1 ? { ok: true } : { ok: false, error: 'scritto ma non riletto correttamente' }
      } catch (err) {
        idbWriteTest = { ok: false, error: `${err.name || 'Errore'}: ${err.message || String(err)}` }
      }
      if (!cancelled) setInfo({ persisted, estimate, localStorageBytes, writeTest, idbWriteTest })
    }
    run()
    return () => { cancelled = true }
  }, [])

  return info
}

export default function Settings({ receipts, merchantCategoryMap, onRestore, onClose }) {
  const { t, lang, setLang } = useI18n()
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
        t('settings.restoreConfirm', { current: receipts.length, imported: importedReceipts.length }),
      )
      if (ok) onRestore(importedReceipts, importedMap)
    } catch (err) {
      setImportError(err.message || t('settings.invalidBackup'))
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
      setLockError(t('settings.faceIdError'))
    }
  }

  async function submitPinChange(e) {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')
    if (newPin.length !== 4) { setPinError(t('settings.newCodeLength')); return }
    if (newPin !== confirmPin) { setPinError(t('settings.codesDontMatch')); return }
    setPinBusy(true)
    const ok = await changeVaultPin(currentPin, newPin)
    setPinBusy(false)
    if (ok) {
      setPinSuccess(t('settings.codeUpdated'))
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } else {
      setPinError(t('settings.wrongCurrentCode'))
    }
  }

  const dateLocale = lang === 'en' ? 'en-GB' : lang === 'fr' ? 'fr-FR' : 'it-IT'

  return (
    <div className="screen">
      <div className="pad dash-head" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 18px)' }}>
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> {t('common.back')}</button>
      </div>
      <div className="pad">
        <h1 className="scr-title">{t('settings.title')}</h1>
        <p className="backup-hint" style={{ marginTop: 4 }}>
          {t('settings.appVersion', { date: new Date(__BUILD_TIME__).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) })}
        </p>
      </div>

      <div className="pad backup-block">
        <p className="sect-label">{t('settings.language')}</p>
        <div className="backup-actions">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              className={`btn ${lang === l.id ? 'is-active' : ''}`}
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pad backup-block">
        <p className="sect-label">{t('settings.storageDiagnostics')}</p>
        <p className="backup-hint">
          {receipts.length} {receipts.length === 1 ? t('common.receipt_one') : t('common.receipt_other')} {t('settings.saved')}
          {storageInfo && ` · ${t('settings.usedOnDevice', { kb: bytesToKb(storageInfo.localStorageBytes) })}`}
        </p>
        <p className="backup-hint">
          {t('settings.persistentStorage')}: {storageInfo == null
            ? '…'
            : storageInfo.persisted == null
              ? t('settings.notSupported')
              : storageInfo.persisted ? t('settings.active') : t('settings.notGranted')}
        </p>
        {storageInfo?.estimate?.quota != null && (
          <p className="backup-hint">
            {t('settings.estimatedSpace', { used: bytesToKb(storageInfo.estimate.usage || 0), total: Math.round(storageInfo.estimate.quota / 1024 / 1024) })}
          </p>
        )}
        {storageInfo?.writeTest && (
          <p className={storageInfo.writeTest.ok ? 'backup-hint' : 'notice'}>
            {t('settings.writeTestLocal')}: {storageInfo.writeTest.ok ? t('settings.writeTestOk') : t('settings.writeTestFailed', { error: storageInfo.writeTest.error })}
          </p>
        )}
        {storageInfo?.idbWriteTest && (
          <p className={storageInfo.idbWriteTest.ok ? 'backup-hint' : 'notice'}>
            {t('settings.writeTestIdb')}: {storageInfo.idbWriteTest.ok ? t('settings.writeTestOk') : t('settings.writeTestFailed', { error: storageInfo.idbWriteTest.error })}
          </p>
        )}
      </div>

      <div className="pad backup-block">
        <p className="sect-label">{t('settings.backupData')}</p>
        <p className="backup-hint">{t('settings.backupHint')}</p>
        <div className="backup-actions">
          <button className="btn" onClick={exportBackup} disabled={receipts.length === 0}>
            <Icon name="Download" size={15} /> {t('settings.exportBackup')}
          </button>
          <label className="btn">
            <Icon name="Upload" size={15} /> {t('settings.importBackup')}
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} hidden />
          </label>
        </div>
        {importError && <p className="notice">{importError}</p>}
      </div>

      {isBiometricSupported() && (
        <div className="pad backup-block">
          <p className="sect-label">{t('settings.security')}</p>
          <p className="backup-hint">{t('settings.faceIdHint')}</p>
          <button className="btn" onClick={toggleLock}>
            <Icon name="ScanFace" size={15} /> {lockOn ? t('settings.disableFaceId') : t('settings.enableFaceId')}
          </button>
          {lockError && <p className="notice">{lockError}</p>}
        </div>
      )}

      {isVaultSetUp() && (
        <div className="pad backup-block">
          <p className="sect-label">{t('settings.documentsCode')}</p>
          <p className="backup-hint">{t('settings.documentsCodeHint')}</p>
          <form onSubmit={submitPinChange} className="pin-change-form">
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder={t('settings.currentCode')}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder={t('settings.newCode')}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder={t('settings.confirmNewCode')}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            />
            {pinError && <p className="vault-lock-error">{pinError}</p>}
            {pinSuccess && <p className="notice">{pinSuccess}</p>}
            <button className="btn" type="submit" disabled={pinBusy}>{t('settings.updateCode')}</button>
          </form>
        </div>
      )}
    </div>
  )
}
