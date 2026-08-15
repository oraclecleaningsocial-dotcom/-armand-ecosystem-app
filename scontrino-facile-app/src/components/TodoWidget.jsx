import { useState } from 'react'
import Icon from './Icon'
import { useI18n } from '../i18n'

export default function TodoWidget({ todos = [], onAddTodo, onToggleTodo, onDeleteTodo }) {
  const { t } = useI18n()
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAddTodo?.(text.trim())
    setText('')
  }

  const pending = todos.filter((td) => !td.done)
  const done = todos.filter((td) => td.done)

  return (
    <div className="widget-card">
      <p className="widget-title"><Icon name="CheckSquare" size={14} /> {t('todoWidget.title')}</p>

      <form className="reminder-add" onSubmit={submit}>
        <input placeholder={t('todoWidget.placeholder')} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" aria-label={t('common.add')}><Icon name="Plus" size={15} /></button>
      </form>

      {todos.length === 0 ? (
        <p className="empty" style={{ margin: '4px 0 0' }}>{t('todoWidget.empty')}</p>
      ) : (
        <div className="todo-list">
          {[...pending, ...done].map((td) => (
            <div className={`todo-row ${td.done ? 'is-done' : ''}`} key={td.id}>
              <button className="todo-check" onClick={() => onToggleTodo?.(td.id)} aria-label={td.done ? t('todoWidget.markPending') : t('todoWidget.markDone')}>
                <Icon name={td.done ? 'CheckSquare' : 'Square'} size={17} />
              </button>
              <span>{td.text}</span>
              <button className="todo-del" onClick={() => onDeleteTodo?.(td.id)} aria-label={t('todoWidget.deleteTodo')}>
                <Icon name="X" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="widget-hint">
        {t('todoWidget.hint', { pending: pending.length, done: done.length > 0 ? t('todoWidget.doneSuffix', { n: done.length }) : '' })}
      </p>
    </div>
  )
}
