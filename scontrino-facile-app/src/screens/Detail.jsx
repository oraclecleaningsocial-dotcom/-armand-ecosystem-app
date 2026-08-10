import { useState } from 'react'
import Icon from '../components/Icon'
import { CATEGORIES, CATEGORY_MAP } from '../categories'
import { eur, formatDate } from '../utils/format'

export default function Detail({ receipt, onBack, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(receipt)

  if (!receipt) return null
  const cat = CATEGORY_MAP[receipt.category] || CATEGORY_MAP.altro

  function save() {
    onUpdate(receipt.id, {
      merchant: draft.merchant,
      total: Number(draft.total) || 0,
      category: draft.category,
      note: draft.note,
    })
    setEditing(false)
  }

  async function share() {
    const text = `${receipt.merchant} · ${formatDate(receipt.date)} · ${eur(receipt.total)}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Ricevuta', text }) } catch { /* condivisione annullata dall'utente */ }
    } else {
      await navigator.clipboard?.writeText(text)
    }
  }

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onBack}><Icon name="ChevronLeft" size={17} /> Indietro</button>
        <button className="link-btn" onClick={() => (editing ? save() : setEditing(true))}>
          {editing ? <>Salva <Icon name="Check" size={15} /></> : <>Modifica <Icon name="Pencil" size={14} /></>}
        </button>
      </div>

      <div className="pad">
        {receipt.imageDataUrl ? (
          <img className="det-image" src={receipt.imageDataUrl} alt={`Scontrino ${receipt.merchant}`} />
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
          <span className="cat-badge" style={{ background: `${cat.color}22`, color: cat.color }}>
            <Icon name={cat.icon} size={13} /> {cat.label}
          </span>
        )}

        {editing ? (
          <input className="edit-input total" type="number" step="0.01" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} />
        ) : (
          <p className="det-total">{eur(receipt.total)}</p>
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

        <p className="src-line">
          Fonte input: {receipt.ocrRawText ? (receipt.sourceType === 'screenshot' ? 'screenshot pagamento' : 'scansione scontrino') : 'inserimento manuale'} del {formatDate(receipt.date)}
        </p>

        {!editing && (
          <div className="det-actions">
            <button className="btn" onClick={share}><Icon name="Share2" size={15} /> Condividi</button>
            <button className="btn danger" onClick={() => onDelete(receipt.id)}>Elimina</button>
          </div>
        )}
      </div>
    </div>
  )
}
