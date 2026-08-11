import { useState } from 'react'
import Icon from '../components/Icon'
import { CATEGORIES, CATEGORY_MAP } from '../categories'
import { eur, formatDate } from '../utils/format'

export default function Detail({ receipt, onBack, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(receipt)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!receipt) return null
  const cat = CATEGORY_MAP[receipt.category] || CATEGORY_MAP.altro

  const mapQuery = [receipt.merchant, receipt.address].filter(Boolean).join(', ')
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  function save() {
    onUpdate(receipt.id, {
      merchant: draft.merchant,
      total: Number(draft.total) || 0,
      category: draft.category,
      address: draft.address,
      phone: draft.phone,
      vat: draft.vat,
      note: draft.note,
    })
    setEditing(false)
  }

  function cancelEdit() {
    setDraft(receipt)
    setEditing(false)
  }

  async function dataUrlToFile(dataUrl, baseName) {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1] || 'jpg'
    return new File([blob], `${baseName}.${ext}`, { type: blob.type })
  }

  async function share() {
    const subject = `Ricevuta: ${receipt.merchant}`
    const text = `${receipt.merchant} · ${formatDate(receipt.date)} · ${eur(receipt.total)}`
    try {
      if (receipt.imageDataUrl && navigator.canShare) {
        const file = await dataUrlToFile(receipt.imageDataUrl, receipt.merchant || 'ricevuta')
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: subject, text, files: [file] })
          return
        }
      }
      if (navigator.share) {
        await navigator.share({ title: subject, text })
        return
      }
    } catch (err) {
      if (err.name === 'AbortError') return // annullato dall'utente nel foglio di condivisione
    }
    // Desktop o browser senza Web Share: apre il client email predefinito.
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
  }

  function exportPdf() {
    window.print()
  }

  return (
    <div className="screen">
      <div className="det-top">
        {editing ? (
          <button className="link-btn" onClick={cancelEdit}><Icon name="X" size={16} /> Annulla</button>
        ) : (
          <button className="link-btn" onClick={onBack}><Icon name="ChevronLeft" size={17} /> Indietro</button>
        )}
        <button className="link-btn" onClick={() => (editing ? save() : setEditing(true))}>
          {editing ? <>Salva <Icon name="Check" size={15} /></> : <>Modifica <Icon name="Pencil" size={14} /></>}
        </button>
      </div>

      <div className="pad print-area">
        {receipt.imageDataUrl ? (
          <button className="det-image-btn" onClick={() => setPreviewOpen(true)} aria-label="Ingrandisci immagine scontrino">
            <img className="det-image" src={receipt.imageDataUrl} alt={`Scontrino ${receipt.merchant}`} />
          </button>
        ) : (
          <div className="det-image placeholder">
            <Icon name="ScanLine" size={22} className="muted-ic" />
          </div>
        )}

        {editing ? (
          <input className="edit-input title" value={draft.merchant} onChange={(e) => setDraft({ ...draft, merchant: e.target.value })} />
        ) : (
          <h1 className="det-name">{receipt.merchant}</h1>
        )}

        {editing ? (
          <select className="edit-input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        ) : (
          <span className="cat-badge" style={{ background: `${cat.color}3d`, color: cat.color }}>
            <Icon name={cat.icon} size={13} /> {cat.label}
          </span>
        )}

        {editing ? (
          <input className="edit-input total" type="number" step="0.01" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} />
        ) : (
          <p className="det-total">{eur(receipt.total)}</p>
        )}

        {(editing || receipt.address || receipt.phone || receipt.vat) && (
          <div className="merchant-details">
            {editing ? (
              <>
                <label className="field">
                  <span><Icon name="MapPin" size={13} /> Indirizzo</span>
                  <input value={draft.address || ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Non disponibile" />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span><Icon name="Phone" size={13} /> Telefono</span>
                    <input value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="—" />
                  </label>
                  <label className="field">
                    <span><Icon name="FileText" size={13} /> Partita IVA</span>
                    <input value={draft.vat || ''} onChange={(e) => setDraft({ ...draft, vat: e.target.value })} placeholder="—" />
                  </label>
                </div>
              </>
            ) : (
              <>
                {receipt.address && <p className="merchant-detail-row"><Icon name="MapPin" size={14} className="muted-ic" /> {receipt.address}</p>}
                {receipt.phone && <p className="merchant-detail-row"><Icon name="Phone" size={14} className="muted-ic" /> {receipt.phone}</p>}
                {receipt.vat && <p className="merchant-detail-row"><Icon name="FileText" size={14} className="muted-ic" /> P.IVA/CF {receipt.vat}</p>}
              </>
            )}
          </div>
        )}

        {receipt.items.length > 0 && (
          <div className="items">
            {receipt.items.map((it, i) => (
              <div className="item-row" key={i}>
                <span>{it.name}</span>
                <span className="num">{eur(it.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {(editing || receipt.note) && (
          <div className="det-note">
            {editing ? (
              <label className="field">
                <span><Icon name="StickyNote" size={13} /> Nota</span>
                <textarea
                  className="note-input"
                  rows={3}
                  placeholder="Aggiungi una nota…"
                  value={draft.note || ''}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                />
              </label>
            ) : (
              <>
                <p className="sect-label"><Icon name="StickyNote" size={12} /> Nota</p>
                <p className="det-note-text">{receipt.note}</p>
              </>
            )}
          </div>
        )}

        <p className="src-line">
          Fonte input: {receipt.ocrRawText ? (receipt.sourceType === 'screenshot' ? 'screenshot pagamento' : 'scansione scontrino') : 'inserimento manuale'} del {formatDate(receipt.date)}
        </p>

        <div className="det-actions no-print">
          {!editing && (
            <>
              <button className="btn" onClick={share}><Icon name="Share2" size={15} /> Condividi</button>
              <button className="btn" onClick={exportPdf}><Icon name="Download" size={15} /> PDF</button>
            </>
          )}
          <button className="btn danger" onClick={() => onDelete(receipt.id)}>
            <Icon name="Trash2" size={15} /> Elimina
          </button>
        </div>

        {!editing && (
          <div className="map-block no-print">
            <p className="sect-label">Posizione</p>
            <a className="map-card" href={mapsSearchUrl} target="_blank" rel="noreferrer">
              <span className="map-card-ic"><Icon name="MapPin" size={19} /></span>
              <span className="map-card-text">
                <b>{receipt.merchant}</b>
                {receipt.address && <span>{receipt.address}</span>}
              </span>
              <Icon name="ExternalLink" size={16} className="muted-ic" />
            </a>
          </div>
        )}
      </div>

      {previewOpen && receipt.imageDataUrl && (
        <div className="img-lightbox no-print" onClick={() => setPreviewOpen(false)}>
          <button className="img-lightbox-close" onClick={() => setPreviewOpen(false)} aria-label="Chiudi anteprima">
            <Icon name="X" size={20} />
          </button>
          <img src={receipt.imageDataUrl} alt={`Scontrino ${receipt.merchant}`} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
