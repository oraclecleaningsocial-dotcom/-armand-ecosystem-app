import Icon from './Icon'

export default function RemindersWidget({ reminders = [], onDeleteReminder, onNavigate }) {
  const upcoming = reminders.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 5)

  return (
    <div className="widget-card">
      <p className="widget-title"><Icon name="Bell" size={14} /> Promemoria</p>

      {upcoming.length === 0 ? (
        <p className="empty" style={{ margin: '4px 0 0' }}>Nessun promemoria in programma.</p>
      ) : (
        <div className="reminder-list">
          {upcoming.map((r) => (
            <div className="reminder-row" key={r.id}>
              <span>{r.title} <em className="reminder-date">· {r.date.split('-').reverse().join('/')}</em></span>
              <button onClick={() => onDeleteReminder?.(r.id)} aria-label="Elimina promemoria"><Icon name="X" size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <button className="btn currency-convert-btn" onClick={() => onNavigate?.('calendar')}>
        <Icon name="Plus" size={15} /> Aggiungi promemoria
      </button>
      <p className="widget-hint">Fonte input: promemoria salvati dal Calendario.</p>
    </div>
  )
}
