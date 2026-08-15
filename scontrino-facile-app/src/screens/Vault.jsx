import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { useVaultDocuments } from '../utils/vault'
import { formatDate } from '../utils/format'
import { generatePdfThumbnail, renderPdfPages } from '../utils/pdfThumbnail'
import { compressImage } from '../utils/compressImage'
import { useI18n } from '../i18n'

const DOC_TYPES = [
  { id: 'cv', label: 'Curriculum', icon: 'Briefcase' },
  { id: 'payslip', label: 'Busta paga', icon: 'FileText' },
  { id: 'cud', label: 'CUD', icon: 'Landmark' },
  { id: 'altro', label: 'Altro', icon: 'FileText' },
]

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

export default function Vault({ onClose }) {
  const { t } = useI18n()
  const [documents, updateDocs] = useVaultDocuments()
  const [label, setLabel] = useState('')
  const [type, setType] = useState('cv')
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [pdfPages, setPdfPages] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const fileRef = useRef(null)

  // Il visore PDF nativo dentro un <iframe> apriva a uno zoom fisso e scomodo su iOS in
  // standalone, senza modo affidabile di fare pinch-to-zoom-out per vedere tutta la
  // pagina. Renderizzando ogni pagina come immagine larga quanto il contenitore, il
  // documento si legge intero da subito, semplice scroll verticale, niente zoom da gestire.
  useEffect(() => {
    if (!viewing || viewing.fileMime?.startsWith('image/')) { setPdfPages(null); return }
    let cancelled = false
    setPdfLoading(true)
    setPdfError('')
    setPdfPages(null)
    renderPdfPages(viewing.fileDataUrl)
      .then((pages) => { if (!cancelled) setPdfPages(pages) })
      .catch(() => { if (!cancelled) setPdfError(t('vault.pdfViewError')) })
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
      // Una foto di un documento (non un PDF vero e proprio) può pesare diversi MB come
      // uno scontrino — stessa quota di localStorage da salvaguardare (vedi
      // compressImage.js). Qualità/risoluzione più alte di quelle usate per gli scontrini,
      // dato che qui il documento stesso è ciò che serve rileggere, non solo dati già
      // estratti da un OCR. I PDF restano intatti: comprimerli davvero richiederebbe
      // decodificarli e riscriverli, un lavoro diverso e più rischioso per la fedeltà.
      const isImage = file.type.startsWith('image/')
      const fileDataUrl = isImage ? await compressImage(rawDataUrl, 1600, 0.82).catch(() => rawDataUrl) : rawDataUrl
      // Il nome originale può avere un'estensione diversa (.png, .heic) da quella reale
      // del contenuto ricompresso in JPEG — la teniamo coerente per download/condivisione.
      const fileName = isImage ? file.name.replace(/\.\w+$/, '') + '.jpg' : file.name
      const doc = {
        id: `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        label: label.trim() || t(`docType.${type}`) || 'Documento',
        type,
        fileName,
        fileMime: isImage ? 'image/jpeg' : file.type,
        fileDataUrl,
        createdAt: new Date().toISOString(),
      }
      updateDocs((prev) => [doc, ...prev])
      setLabel('')

      // Un'anteprima vera della prima pagina invece della sola icona generica — solo per
      // i PDF (le immagini si mostrano già direttamente). Genera dopo il salvataggio,
      // così un PDF che pdf.js non riesce a renderizzare (raro, ma possibile) non blocca
      // comunque il caricamento del documento stesso.
      if (file.type === 'application/pdf') {
        try {
          const thumbnailDataUrl = await generatePdfThumbnail(fileDataUrl)
          updateDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, thumbnailDataUrl } : d)))
        } catch {
          // niente anteprima: la card resta con l'icona generica, non è un errore bloccante
        }
      }
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(id) {
    if (!window.confirm(t('vault.deleteConfirm'))) return
    updateDocs((prev) => prev.filter((d) => d.id !== id))
    if (viewing?.id === id) setViewing(null)
  }

  function downloadDoc(doc) {
    const a = document.createElement('a')
    a.href = doc.fileDataUrl
    a.download = doc.fileName || doc.label
    a.click()
  }

  async function shareDoc(doc) {
    try {
      const file = dataUrlToFile(doc.fileDataUrl, doc.fileName || doc.label, doc.fileMime)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: doc.label })
        return
      }
    } catch {
      // condivisione annullata o non supportata: si ripiega sul download
    }
    downloadDoc(doc)
  }

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> {t('common.back')}</button>
        <span className="vault-header-lock"><Icon name="Lock" size={13} /> {t('vault.protected')}</span>
      </div>

      <div className="pad">
        <h1 className="scr-title">{t('vault.title')}</h1>
        <p className="backup-hint">{t('vault.description')}</p>

        <div className="vault-upload">
          <select className="edit-input" value={type} onChange={(e) => setType(e.target.value)}>
            {DOC_TYPES.map((dt) => <option key={dt.id} value={dt.id}>{t(`docType.${dt.id}`)}</option>)}
          </select>
          <input className="edit-input" placeholder={t('vault.name')} value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="vault-upload-actions">
            {/* Con capture="environment" la fotocamera si apre subito, come per lo
                scanner degli scontrini — invece del selettore file generico qui sotto,
                che su iOS/Android richiede un tocco in più per arrivare alla fotocamera
                (mostra prima Libreria foto/File). Stesso handleFile per entrambe: una
                foto è una foto, non importa da dove arriva. */}
            <label className={`btn vault-upload-btn ${busy ? 'is-busy' : ''}`}>
              <Icon name={busy ? 'Loader2' : 'ScanLine'} size={15} className={busy ? 'spin' : ''} /> {busy ? t('vault.scanning') : t('vault.scanDocument')}
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={busy} hidden />
            </label>
            <label className={`btn vault-upload-btn ${busy ? 'is-busy' : ''}`}>
              <Icon name={busy ? 'Loader2' : 'Upload'} size={15} className={busy ? 'spin' : ''} /> {busy ? t('vault.uploading') : t('vault.uploadFromGallery')}
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={busy} hidden />
            </label>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="empty">{t('vault.noDocuments')}</p>
        ) : (
          <div className="vault-doc-grid">
            {documents.map((doc) => {
              const meta = DOC_TYPES.find((dt) => dt.id === doc.type) || DOC_TYPES[3]
              const isImage = doc.fileMime?.startsWith('image/')
              const previewSrc = isImage ? doc.fileDataUrl : doc.thumbnailDataUrl
              return (
                <div className="vault-doc-card" key={doc.id}>
                  <button className="vault-doc-thumb" onClick={() => setViewing(doc)} aria-label={t('vault.openDocument', { name: doc.label })}>
                    {previewSrc ? (
                      <img src={previewSrc} alt={doc.label} />
                    ) : (
                      <span className="vault-doc-thumb-ic"><Icon name={meta.icon} size={26} /></span>
                    )}
                  </button>
                  <button className="vault-doc-del" onClick={() => handleDelete(doc.id)} aria-label={t('vault.deleteDocument')}>
                    <Icon name="Trash2" size={14} />
                  </button>
                  <div className="vault-doc-card-text">
                    <b>{doc.label}</b>
                    <span>{formatDate(doc.createdAt)}</span>
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
                <button onClick={() => shareDoc(viewing)} aria-label={t('common.share')}><Icon name="Share2" size={17} /></button>
                <button onClick={() => downloadDoc(viewing)} aria-label={t('common.export')}><Icon name="Download" size={17} /></button>
                <button onClick={() => setViewing(null)} aria-label={t('common.close')}><Icon name="X" size={19} /></button>
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
                  {pdfPages?.map((src, i) => <img key={i} src={src} alt={t('vault.page', { n: i + 1 })} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
