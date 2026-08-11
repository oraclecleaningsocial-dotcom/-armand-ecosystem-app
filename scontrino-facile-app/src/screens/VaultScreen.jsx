import { useState } from 'react'
import VaultLock from './VaultLock'
import Vault from './Vault'

// Il "blocco" vive qui, non nello storage: ogni volta che si entra nella sezione
// bisogna reinserire il codice, anche se il vault è già stato impostato in passato.
export default function VaultScreen({ onClose }) {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) return <VaultLock onUnlock={() => setUnlocked(true)} onCancel={onClose} />
  return <Vault onClose={onClose} />
}
