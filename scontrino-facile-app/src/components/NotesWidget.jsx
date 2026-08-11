import { useState } from 'react'
import Icon from './Icon'

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
        <div className="reminder-list" style={{ marginTop: 10 }}>
          {notes.map((n) => (
            <div className="reminder-row" key={n.id}>
              <span>{n.text}</span>
              <button onClick={() => onDeleteNote?.(n.id)} aria-label="Elimina nota"><Icon name="X" size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <p className="widget-hint">Note salvate solo su questo dispositivo.</p>
    </div>
  )
}
