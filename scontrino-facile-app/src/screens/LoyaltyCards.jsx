import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { sortCards, useCards } from '../utils/cards'
import { useBarcodeScanner } from '../utils/barcodeScanner'
import { KNOWN_STORES, matchStoreBrand } from '../utils/storeBrands'
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

// La foto della carta non basta più da sola a "riconoscere" la carta: una card colorata
// con il nome dell'esercente (niente logo scaricato da internet — vedi storeBrands.js sul
// perché) si mostra al posto dell'icona generica quando non c'è ancora una foto caricata,
// così una carta aggiunta solo scansionando il codice a barre resta comunque leggibile a
// colpo d'occhio, un po' come le card generate automaticamente in app tipo Stocard.
function BrandCover({ label, brand, size = 26, large = false }) {
  if (!brand) return <span className="vault-doc-thumb-ic"><Icon name="CreditCard" size={size} /></span>
  return (
    <div
      className={`brand-cover ${large ? 'brand-cover-lg' : ''}`}
      style={{ background: `linear-gradient(135deg, ${brand.color}, color-mix(in srgb, ${brand.color} 70%, black))` }}
    >
      <Icon name="CreditCard" size={size} />
      <span>{label}</span>
    </div>
  )
}

export default function LoyaltyCards({ onClose }) {
  const [cards, updateCards] = useCards()
  const [label, setLabel] = useState('')
  const [number, setNumber] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [pdfPages, setPdfPages] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const photoInputRef = useRef(null)

  const scanner = useBarcodeScanner((code) => setNumber(code))

  async function handleScanPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await scanner.decodeFile(file)
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const rawDataUrl = await readAsDataUrl(file)
    const isImage = file.type.startsWith('image/')
    const fileDataUrl = isImage ? await compressImage(rawDataUrl, 1600, 0.82).catch(() => rawDataUrl) : rawDataUrl
    const fileName = isImage ? file.name.replace(/\.\w+$/, '') + '.jpg' : file.name
    setPendingFile({ fileDataUrl, fileMime: isImage ? 'image/jpeg' : file.type, fileName })
  }

  async function saveCard() {
    if (!label.trim()) return
    setSaving(true)
    try {
      const card = {
        id: `card_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        label: label.trim(),
        number: number.trim(),
        fileName: pendingFile?.fileName || '',
        fileMime: pendingFile?.fileMime || '',
        fileDataUrl: pendingFile?.fileDataUrl || '',
        createdAt: new Date().toISOString(),
      }
      updateCards((prev) => [card, ...prev])
      setLabel('')
      setNumber('')
      setPendingFile(null)

      if (pendingFile?.fileMime === 'application/pdf') {
        try {
          const thumbnailDataUrl = await generatePdfThumbnail(pendingFile.fileDataUrl)
          updateCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, thumbnailDataUrl } : c)))
        } catch {
          // niente anteprima: la card resta con la copertina colorata o l'icona, non è un errore bloccante
        }
      }
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!viewing || !viewing.fileMime || viewing.fileMime.startsWith('image/')) { setPdfPages(null); return }
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
  const pendingBrand = matchStoreBrand(label)

  return (
    <div className="screen cards-screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> Indietro</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">Carte</h1>
        <p className="backup-hint">
          Carte fedeltà del supermercato o di altri negozi: scansiona il codice a barre e/o carica la foto, senza
          codici da inserire — comoda da mostrare subito alla cassa.
        </p>

        <div className="vault-upload">
          <input
            className="edit-input"
            placeholder="Nome (es. IKEA Family, Esselunga)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            list="store-suggestions"
          />
          <datalist id="store-suggestions">
            {KNOWN_STORES.map((s) => <option key={s.name} value={s.name} />)}
          </datalist>

          <div className="card-number-row">
            <input className="edit-input" placeholder="Numero carta (facoltativo)" value={number} onChange={(e) => setNumber(e.target.value)} />
            <label className={`btn card-scan-btn ${scanner.busy ? 'is-busy' : ''}`}>
              <Icon name={scanner.busy ? 'Loader2' : 'ScanBarcode'} size={15} className={scanner.busy ? 'spin' : ''} />
              <input type="file" accept="image/*" capture="environment" onChange={handleScanPhoto} disabled={scanner.busy} hidden />
            </label>
          </div>
          {scanner.error && <p className="notice">{scanner.error}</p>}

          <label className="btn vault-upload-btn">
            <Icon name="Upload" size={15} /> {pendingFile ? 'Cambia foto della carta' : 'Aggiungi foto della carta (facoltativo)'}
            <input ref={photoInputRef} type="file" accept="image/*,application/pdf" onChange={handlePhotoPick} hidden />
          </label>

          {(label.trim() || pendingFile) && (
            <div className="card-preview-row">
              <div className="card-preview-thumb">
                {pendingFile?.fileMime?.startsWith('image/') ? (
                  <img src={pendingFile.fileDataUrl} alt="Anteprima" />
                ) : pendingFile ? (
                  <span className="vault-doc-thumb-ic"><Icon name="FileText" size={22} /></span>
                ) : (
                  <BrandCover label={label.trim() || 'Carta'} brand={pendingBrand} size={18} />
                )}
              </div>
              <span className="card-preview-hint">
                {pendingBrand ? `Riconosciuta come ${pendingBrand.name}: copertina colorata pronta.` : 'Nessuna catena riconosciuta: copertina generica.'}
              </span>
            </div>
          )}

          <button className="btn currency-convert-btn" onClick={saveCard} disabled={saving || !label.trim()}>
            <Icon name={saving ? 'Loader2' : 'Plus'} size={15} className={saving ? 'spin' : ''} /> Salva carta
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="empty">Nessuna carta salvata.</p>
        ) : (
          <div className="vault-doc-grid">
            {sorted.map((c) => {
              const isImage = c.fileMime?.startsWith('image/')
              const previewSrc = isImage ? c.fileDataUrl : c.thumbnailDataUrl
              const brand = matchStoreBrand(c.label)
              return (
                <div className="vault-doc-card" key={c.id}>
                  <button className="vault-doc-thumb" onClick={() => setViewing(c)} aria-label={`Apri ${c.label}`}>
                    {previewSrc ? <img src={previewSrc} alt={c.label} /> : <BrandCover label={c.label} brand={brand} size={22} />}
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
                {viewing.fileDataUrl && <button onClick={() => shareCard(viewing)} aria-label="Condividi"><Icon name="Share2" size={17} /></button>}
                {viewing.fileDataUrl && <button onClick={() => downloadCard(viewing)} aria-label="Esporta"><Icon name="Download" size={17} /></button>}
                <button onClick={() => setViewing(null)} aria-label="Chiudi"><Icon name="X" size={19} /></button>
              </div>
            </div>
            <div className="vault-viewer-body">
              {!viewing.fileDataUrl ? (
                <BrandCover label={viewing.label} brand={matchStoreBrand(viewing.label)} size={40} large />
              ) : viewing.fileMime?.startsWith('image/') ? (
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
