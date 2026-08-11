import { useState } from 'react'
import Icon from './Icon'

export default function TodoWidget({ todos = [], onAddTodo, onToggleTodo, onDeleteTodo }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAddTodo?.(text.trim())
    setText('')
  }

  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  return (
    <div className="widget-card">
      <p className="widget-title"><Icon name="CheckSquare" size={14} /> Da fare</p>

      <form className="reminder-add" onSubmit={submit}>
        <input placeholder="Aggiungi un'attività…" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" aria-label="Aggiungi"><Icon name="Plus" size={15} /></button>
      </form>

      {todos.length === 0 ? (
        <p className="empty" style={{ margin: '4px 0 0' }}>Nessuna attività ancora.</p>
      ) : (
        <div className="todo-list">
          {[...pending, ...done].map((t) => (
            <div className={`todo-row ${t.done ? 'is-done' : ''}`} key={t.id}>
              <button className="todo-check" onClick={() => onToggleTodo?.(t.id)} aria-label={t.done ? 'Segna da fare' : 'Segna come fatto'}>
                <Icon name={t.done ? 'CheckSquare' : 'Square'} size={17} />
              </button>
              <span>{t.text}</span>
              <button className="todo-del" onClick={() => onDeleteTodo?.(t.id)} aria-label="Elimina attività">
                <Icon name="X" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="widget-hint">
        {pending.length} da fare{done.length > 0 ? ` · ${done.length} completate` : ''}. Salvate solo su questo dispositivo.
      </p>
    </div>
  )
}
