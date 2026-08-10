import { useState } from 'react'
import Icon from '../components/Icon'
import { disableLock, verifyBiometric } from '../utils/auth'

export default function LockScreen({ onUnlock }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function unlock() {
    setBusy(true)
    setError('')
    try {
      await verifyBiometric()
      onUnlock()
    } catch {
      setError('Verifica non riuscita. Riprova.')
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
      <h1>ScontrinoFacile</h1>
      <p>Sblocca per vedere le tue ricevute</p>

      <button className="lock-btn" onClick={unlock} disabled={busy}>
        {busy ? 'Verifica in corso…' : 'Sblocca con Face ID'}
      </button>
      {error && <p className="lock-error">{error}</p>}

      <button className="lock-fallback" onClick={bypassLock}>
        Problemi con Face ID? Disattiva il blocco
      </button>
    </div>
  )
}
