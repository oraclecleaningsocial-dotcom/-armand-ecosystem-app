import { useState } from 'react'
import Icon from '../components/Icon'
import { disableLock, verifyBiometric } from '../utils/auth'
import { useI18n } from '../i18n'

export default function LockScreen({ onUnlock }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function unlock() {
    setBusy(true)
    setError('')
    try {
      await verifyBiometric()
      onUnlock()
    } catch {
      setError(t('lock.error'))
    } finally {
      setBusy(false)
    }
  }

  function bypassLock() {
    disableLock()
    onUnlock()
  }

  return (
    <div className="lock-screen">
      <div className="lock-icon"><Icon name="ScanFace" size={38} /></div>
      <h1>{t('lock.title')}</h1>
      <p>{t('lock.subtitle')}</p>

      <button className="lock-btn" onClick={unlock} disabled={busy}>
        {busy ? t('lock.unlocking') : t('lock.unlockWithFaceId')}
      </button>
      {error && <p className="lock-error">{error}</p>}

      <button className="lock-fallback" onClick={bypassLock}>
        {t('lock.faceIdProblem')}
      </button>
    </div>
  )
}
