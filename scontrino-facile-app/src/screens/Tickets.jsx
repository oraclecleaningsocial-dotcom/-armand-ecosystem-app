import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { isPastTicket, sortTickets, TICKET_TYPES, useTickets } from '../utils/tickets'
import { formatDate } from '../utils/format'
import { generatePdfThumbnail, renderPdfPages } from '../utils/pdfThumbnail'
import { compressImage } from '../utils/compressImage'
import { useI18n } from '../i18n'

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

export default function Tickets({ onClose }) {
  const { t } = useI18n()
  const [tickets, updateTickets] = useTickets()
  const [label, setLabel] = useState('')
  const [type, setType] = useState('treno')
  const [date, setDate] = useState('')
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
      const isImage = file.type.startsWith('image/')
      // Qualità/risoluzione come per i documenti del Vault: un biglietto va riletto per
      // intero (a volte serve zoomare su un QR/codice a barre), non solo archiviato.
      const fileDataUrl = isImage ? await compressImage(rawDataUrl, 1600, 0.82).catch(() => rawDataUrl) : rawDataUrl
      const fileName = isImage ? file.name.replace(/\.\w+$/, '') + '.jpg' : file.name
      const ticket = {
        id: `ticket_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        label: label.trim() || t(`ticketType.${type}`) || 'Biglietto',
        type,
        date: date || null,
        fileName,
        fileMime: isImage ? 'image/jpeg' : file.type,
        fileDataUrl,
        createdAt: new Date().toISOString(),
      }
      updateTickets((prev) => [ticket, ...prev])
      setLabel('')
      setDate('')

      if (file.type === 'application/pdf') {
        try {
          const thumbnailDataUrl = await generatePdfThumbnail(fileDataUrl)
          updateTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, thumbnailDataUrl } : t)))
        } catch {
          // niente anteprima: la card resta con l'icona generica, non è un errore bloccante
        }
      }
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(id) {
    if (!window.confirm(t('tickets.deleteConfirm'))) return
    updateTickets((prev) => prev.filter((t) => t.id !== id))
    if (viewing?.id === id) setViewing(null)
  }

  function downloadTicket(ticket) {
    const a = document.createElement('a')
    a.href = ticket.fileDataUrl
    a.download = ticket.fileName || ticket.label
    a.click()
  }

  async function shareTicket(ticket) {
    try {
      const file = dataUrlToFile(ticket.fileDataUrl, ticket.fileName || ticket.label, ticket.fileMime)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: ticket.label })
        return
      }
    } catch {
      // condivisione annullata o non supportata: si ripiega sul download
    }
    downloadTicket(ticket)
  }

  const sorted = sortTickets(tickets)

  return (
    <div className="screen tickets-screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> {t('common.back')}</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">{t('tickets.title')}</h1>
        <p className="backup-hint">{t('tickets.description')}</p>

        <div className="vault-upload">
          <select className="edit-input" value={type} onChange={(e) => setType(e.target.value)}>
            {TICKET_TYPES.map((tt) => <option key={tt.id} value={tt.id}>{t(`ticketType.${tt.id}`)}</option>)}
          </select>
          <input className="edit-input" placeholder={t('tickets.namePlaceholder')} value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="edit-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <label className={`btn vault-upload-btn ${busy ? 'is-busy' : ''}`}>
            <Icon name={busy ? 'Loader2' : 'Upload'} size={15} className={busy ? 'spin' : ''} /> {busy ? t('vault.uploading') : t('tickets.upload')}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={busy} hidden />
          </label>
        </div>

        {sorted.length === 0 ? (
          <p className="empty">{t('tickets.noTickets')}</p>
        ) : (
          <div className="vault-doc-grid ticket-grid">
            {sorted.map((tk) => {
              const meta = TICKET_TYPES.find((m) => m.id === tk.type) || TICKET_TYPES[3]
              const isImage = tk.fileMime?.startsWith('image/')
              const previewSrc = isImage ? tk.fileDataUrl : tk.thumbnailDataUrl
              const past = isPastTicket(tk)
              return (
                <div className={`vault-doc-card ticket-card ${past ? 'is-past' : ''}`} key={tk.id}>
                  <button className="vault-doc-thumb" onClick={() => setViewing(tk)} aria-label={t('vault.openDocument', { name: tk.label })}>
                    {previewSrc ? (
                      <img src={previewSrc} alt={tk.label} />
                    ) : (
                      <span className="vault-doc-thumb-ic"><Icon name={meta.icon} size={26} /></span>
                    )}
                  </button>
                  <button className="vault-doc-del" onClick={() => handleDelete(tk.id)} aria-label={t('tickets.deleteTicket')}>
                    <Icon name="Trash2" size={14} />
                  </button>
                  <div className="vault-doc-card-text">
                    <b>{tk.label}</b>
                    <span>{tk.date ? formatDate(tk.date) : t(`ticketType.${meta.id}`)}{past ? ` · ${t('tickets.past')}` : ''}</span>
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
                <button onClick={() => shareTicket(viewing)} aria-label={t('common.share')}><Icon name="Share2" size={17} /></button>
                <button onClick={() => downloadTicket(viewing)} aria-label={t('common.export')}><Icon name="Download" size={17} /></button>
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
