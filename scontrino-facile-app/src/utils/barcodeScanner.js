function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// La Barcode Detection API nativa (BarcodeDetector) non esiste in Safari/iOS: usarla
// come unica via, come nel primo tentativo, lasciava il tasto "Scansiona" senza aprire
// affatto la fotocamera su iPhone. Qui si usa invece lo stesso meccanismo già affidabile
// per gli scontrini — <input type="file" capture="environment"> apre la fotocamera nativa
// su qualsiasi browser — e si decodifica il codice a barre dalla foto scattata con ZXing
// (libreria JS pura, non dipende da API sperimentali del browser). Condiviso tra Prodotti
// e Carte: stesso identico meccanismo, stesso identico messaggio d'errore.
import { useState } from 'react'

export function useBarcodeScanner(onDetected) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function decodeFile(file) {
    setBusy(true)
    setError('')
    try {
      const dataUrl = await readAsDataUrl(file)
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeFromImageUrl(dataUrl)
      onDetected(result.getText())
    } catch {
      setError('Codice a barre non riconosciuto nella foto. Riprova inquadrandolo più da vicino, oppure inseriscilo a mano.')
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, decodeFile }
}
