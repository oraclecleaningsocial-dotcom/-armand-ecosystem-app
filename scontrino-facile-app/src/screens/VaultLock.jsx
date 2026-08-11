import { useState } from 'react'
import Icon from '../components/Icon'
import { isVaultSetUp, resetVault, setupVaultPin, verifyVaultPin } from '../utils/vault'

export default function VaultLock({ onUnlock, onCancel }) {
  const [mode, setMode] = useState(() => (isVaultSetUp() ? 'unlock' : 'setup'))
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSetup(e) {
    e.preventDefault()
    setError('')
    if (pin.length < 4) { setError('Il codice deve avere almeno 4 cifre.'); return }
    if (pin !== confirmPin) { setError('I due codici non coincidono.'); return }
    setBusy(true)
    await setupVaultPin(pin)
    setBusy(false)
    onUnlock()
  }

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const ok = await verifyVaultPin(pin)
    setBusy(false)
    if (ok) onUnlock()
    else { setError('Codice errato.'); setPin('') }
  }

  function handleReset() {
    resetVault()
    setShowReset(false)
    setPin('')
    setConfirmPin('')
    setError('')
    setMode('setup')
  }

  return (
    <div className="screen vault-lock">
      <div className="vault-lock-top">
        <button className="link-btn" onClick={onCancel}><Icon name="ChevronLeft" size={17} /> Indietro</button>
      </div>
      <div className="vault-lock-body">
        <span className="vault-lock-icon"><Icon name={mode === 'setup' ? 'Lock' : 'Unlock'} size={26} /></span>
        <h1>{mode === 'setup' ? 'Crea un codice' : 'Documenti protetti'}</h1>
        <p>{mode === 'setup' ? 'Proteggi curriculum, buste paga e CUD con un codice numerico.' : 'Inserisci il codice per accedere.'}</p>

        <form onSubmit={mode === 'setup' ? handleSetup : handleUnlock}>
          <input
            className="vault-pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="Codice"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
          {mode === 'setup' && (
            <input
              className="vault-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="Conferma codice"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            />
          )}
          {error && <p className="vault-lock-error">{error}</p>}
          <button className="vault-lock-btn" type="submit" disabled={busy}>
            {mode === 'setup' ? 'Crea codice' : 'Sblocca'}
          </button>
        </form>

        {mode === 'unlock' && !showReset && (
          <button className="vault-lock-fallback" onClick={() => setShowReset(true)}>Codice dimenticato?</button>
        )}
        {showReset && (
          <div className="vault-reset-confirm">
            <p>Reimpostando il codice perderai tutti i documenti salvati qui. Continuare?</p>
            <div className="vault-reset-actions">
              <button className="btn" onClick={() => setShowReset(false)}>Annulla</button>
              <button className="btn danger" onClick={handleReset}>Cancella e reimposta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
