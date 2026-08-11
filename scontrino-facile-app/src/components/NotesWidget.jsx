import { useState } from 'react'
import Icon from './Icon'

// Colori da bigliettino adesivo — ciclati per id invece che per posizione, così una nota
// non cambia colore ogni volta che se ne aggiunge un'altra prima nell'elenco.
const NOTE_COLORS = ['#f0d666', '#f3a9ba', '#9fd9c9', '#a7c8f2', '#d8b6f2', '#f2c08a']

function colorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return NOTE_COLORS[hash % NOTE_COLORS.length]
}

export default function NotesWidget({ notes = [], onAddNote, onDeleteNote }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAddNote?.(text.trim())
    setText('')
  }

  return (
    <div className="widget-card">
      <p className="widget-title"><Icon name="StickyNote" size={14} /> Note</p>

      <form className="reminder-add" onSubmit={submit}>
        <input
          placeholder="Scrivi una nota…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" aria-label="Aggiungi"><Icon name="Plus" size={15} /></button>
      </form>

      {notes.length === 0 ? (
        <p className="empty" style={{ margin: '4px 0 0' }}>Nessuna nota ancora.</p>
      ) : (
        <div className="notes-grid">
          {notes.map((n) => (
            <div className="sticky-note" key={n.id} style={{ background: colorFor(n.id) }}>
              <button className="sticky-note-del" onClick={() => onDeleteNote?.(n.id)} aria-label="Elimina nota">
                <Icon name="X" size={12} />
              </button>
              <p>{n.text}</p>
            </div>
          ))}
        </div>
      )}

      <p className="widget-hint">Note salvate solo su questo dispositivo.</p>
    </div>
  )
}
