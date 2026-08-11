import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { sortCards, useCards } from '../utils/cards'
import { generatePdfThumbnail, renderPdfPages } from '../utils/pdfThumbnail'
import { compressImage } from '../utils/compressImage'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataUrlToFile(dataUrl, fileName, mime) {
  const [, base64] = dataUrl.split(',')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], fileName, { type: mime })
}

export default function LoyaltyCards({ onClose }) {
  const [cards, updateCards] = useCards()
  const [label, setLabel] = useState('')
  const [number, setNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [pdfPages, setPdfPages] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!viewing || viewing.fileMime?.startsWith('image/')) { setPdfPages(null); return }
    let cancelled = false
    setPdfLoading(true)
    setPdfError('')
    setPdfPages(null)
    renderPdfPages(viewing.fileDataUrl)
      .then((pages) => { if (!cancelled) setPdfPages(pages) })
      .catch(() => { if (!cancelled) setPdfError('Non riesco a visualizzare questo documento qui. Puoi comunque scaricarlo o condividerlo.') })
      .finally(() => { if (!cancelled) setPdfLoading(false) })
    return () => { cancelled = true }
  }, [viewing])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const rawDataUrl = await readAsDataUrl(file)
      const isImage = file.type.startsWith('image/')
      const fileDataUrl = isImage ? await compressImage(rawDataUrl, 1600, 0.82).catch(() => rawDataUrl) : rawDataUrl
      const fileName = isImage ? file.name.replace(/\.\w+$/, '') + '.jpg' : file.name
      const card = {
        id: `card_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        label: label.trim() || 'Carta senza nome',
        number: number.trim(),
        fileName,
        fileMime: isImage ? 'image/jpeg' : file.type,
        fileDataUrl,
        createdAt: new Date().toISOString(),
      }
      updateCards((prev) => [card, ...prev])
      setLabel('')
      setNumber('')

      if (file.type === 'application/pdf') {
        try {
          const thumbnailDataUrl = await generatePdfThumbnail(fileDataUrl)
          updateCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, thumbnailDataUrl } : c)))
        } catch {
          // niente anteprima: la card resta con l'icona generica, non è un errore bloccante
        }
      }
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(id) {
    if (!window.confirm('Eliminare questa carta?')) return
    updateCards((prev) => prev.filter((c) => c.id !== id))
    if (viewing?.id === id) setViewing(null)
  }

  function downloadCard(card) {
    const a = document.createElement('a')
    a.href = card.fileDataUrl
    a.download = card.fileName || card.label
    a.click()
  }

  async function shareCard(card) {
    try {
      const file = dataUrlToFile(card.fileDataUrl, card.fileName || card.label, card.fileMime)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: card.label })
        return
      }
    } catch {
      // condivisione annullata o non supportata: si ripiega sul download
    }
    downloadCard(card)
  }

  const sorted = sortCards(cards)

  return (
    <div className="screen cards-screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> Indietro</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">Carte</h1>
        <p className="backup-hint">
          Carte fedeltà del supermercato o di altri negozi: carica la foto del codice a barre e trovala qui, senza
          codici da inserire — comoda da mostrare subito alla cassa.
        </p>

        <div className="vault-upload">
          <input className="edit-input" placeholder="Nome (es. Esselunga Fidaty)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="edit-input" placeholder="Numero carta (facoltativo)" value={number} onChange={(e) => setNumber(e.target.value)} />
          <label className={`btn vault-upload-btn ${busy ? 'is-busy' : ''}`}>
            <Icon name={busy ? 'Loader2' : 'Upload'} size={15} className={busy ? 'spin' : ''} /> {busy ? 'Caricamento…' : 'Carica carta'}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={busy} hidden />
          </label>
        </div>

        {sorted.length === 0 ? (
          <p className="empty">Nessuna carta salvata.</p>
        ) : (
          <div className="vault-doc-grid">
            {sorted.map((c) => {
              const isImage = c.fileMime?.startsWith('image/')
              const previewSrc = isImage ? c.fileDataUrl : c.thumbnailDataUrl
              return (
                <div className="vault-doc-card" key={c.id}>
                  <button className="vault-doc-thumb" onClick={() => setViewing(c)} aria-label={`Apri ${c.label}`}>
                    {previewSrc ? (
                      <img src={previewSrc} alt={c.label} />
                    ) : (
                      <span className="vault-doc-thumb-ic"><Icon name="CreditCard" size={26} /></span>
                    )}
                  </button>
                  <button className="vault-doc-del" onClick={() => handleDelete(c.id)} aria-label="Elimina carta">
                    <Icon name="Trash2" size={14} />
                  </button>
                  <div className="vault-doc-card-text">
                    <b>{c.label}</b>
                    <span>{c.number || 'Numero non inserito'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {viewing && (
        <div className="vault-viewer-overlay" onClick={() => setViewing(null)}>
          <div className="vault-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="vault-viewer-head">
              <span className="vault-viewer-title">{viewing.label}</span>
              <div className="vault-viewer-actions">
                <button onClick={() => shareCard(viewing)} aria-label="Condividi"><Icon name="Share2" size={17} /></button>
                <button onClick={() => downloadCard(viewing)} aria-label="Esporta"><Icon name="Download" size={17} /></button>
                <button onClick={() => setViewing(null)} aria-label="Chiudi"><Icon name="X" size={19} /></button>
              </div>
            </div>
            <div className="vault-viewer-body">
              {viewing.fileMime?.startsWith('image/') ? (
                <img src={viewing.fileDataUrl} alt={viewing.label} />
              ) : pdfLoading ? (
                <Icon name="Loader2" size={26} className="spin" />
              ) : pdfError ? (
                <p className="notice">{pdfError}</p>
              ) : (
                <div className="pdf-pages">
                  {pdfPages?.map((src, i) => <img key={i} src={src} alt={`Pagina ${i + 1}`} />)}
                </div>
              )}
            </div>
            {viewing.number && <p className="card-number-line">{viewing.number}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
