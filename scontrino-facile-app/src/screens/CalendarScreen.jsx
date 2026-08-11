import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import ReceiptCalendar from '../components/ReceiptCalendar'
import ReceiptRow from '../components/ReceiptRow'
import { eur, toLocalDateKey } from '../utils/format'
import { useScrollRestore } from '../utils/scrollRestore'

const todayIso = toLocalDateKey

export default function CalendarScreen({ receipts, onOpen, reminders, onAddReminder, onDeleteReminder }) {
  const scrollRef = useScrollRestore('calendar')
  const [mode, setMode] = useState('calendar') // calendar | range | reminder
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reminderDate, setReminderDate] = useState(todayIso)
  const [reminderTitle, setReminderTitle] = useState('')

  const rangeResults = useMemo(() => {
    if (!from && !to) return null
    return receipts
      .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [receipts, from, to])

  const rangeTotal = rangeResults ? rangeResults.reduce((s, r) => s + r.total, 0) : 0

  const upcomingReminders = useMemo(
    () => reminders.slice().sort((a, b) => (a.date < b.date ? -1 : 1)),
    [reminders],
  )

  function toggleMode(target) {
    setMode((prev) => (prev === target ? 'calendar' : target))
  }

  function submitReminder(e) {
    e.preventDefault()
    if (!reminderTitle.trim() || !reminderDate) return
    onAddReminder({ date: reminderDate, title: reminderTitle.trim() })
    setReminderTitle('')
  }

  return (
    <div className="screen" ref={scrollRef}>
      <div className="pad cal-screen-head" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 18px)' }}>
        <h1 className="scr-title">Calendario</h1>
        <div className="cal-head-actions">
          <button className="cal-search-btn" onClick={() => toggleMode('reminder')} aria-label={mode === 'reminder' ? 'Chiudi promemoria' : 'Aggiungi promemoria'}>
            <Icon name={mode === 'reminder' ? 'X' : 'Bell'} size={16} />
          </button>
          <button className="cal-search-btn" onClick={() => toggleMode('range')} aria-label={mode === 'range' ? 'Chiudi ricerca per intervallo' : 'Cerca per intervallo di date'}>
            <Icon name={mode === 'range' ? 'X' : 'Search'} size={17} />
          </button>
        </div>
      </div>

      {mode === 'range' && (
        <div className="pad range-search">
          <p className="sect-label" style={{ margin: '0 0 10px' }}>Cerca da data a data</p>
          <div className="field-row">
            <label className="field" style={{ marginTop: 0 }}>
              <span>Da</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field" style={{ marginTop: 0 }}>
              <span>A</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>

          {rangeResults && (
            <>
              <p className="sect-label">
                {rangeResults.length} {rangeResults.length === 1 ? 'ricevuta' : 'ricevute'}
                {rangeResults.length > 0 && <span className="cal-day-total"> · {eur(rangeTotal)}</span>}
              </p>
              {rangeResults.length === 0 ? (
                <p className="empty">Nessuna ricevuta in questo intervallo.</p>
              ) : (
                <div className="list">
                  {rangeResults.map((r) => <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen(id, 'calendar')} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {mode === 'reminder' && (
        <div className="pad range-search">
          <p className="sect-label" style={{ margin: '0 0 10px' }}>Nuovo promemoria</p>
          <form onSubmit={submitReminder}>
            <div className="field-row">
              <label className="field" style={{ marginTop: 0 }}>
                <span>Data</span>
                <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Titolo</span>
              <input placeholder="Es. Pagare bolletta luce" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} />
            </label>
            <button type="submit" className="btn currency-convert-btn">
              <Icon name="Plus" size={15} /> Aggiungi promemoria
            </button>
          </form>

          {upcomingReminders.length > 0 && (
            <>
              <p className="sect-label">Tutti i promemoria</p>
              <div className="reminder-list">
                {upcomingReminders.map((r) => (
                  <div className="reminder-row" key={r.id}>
                    <span>{r.title} <em className="reminder-date">· {r.date.split('-').reverse().join('/')}</em></span>
                    <button onClick={() => onDeleteReminder(r.id)} aria-label="Elimina promemoria"><Icon name="X" size={13} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'calendar' && (
        <ReceiptCalendar
          receipts={receipts}
          onOpen={onOpen}
          reminders={reminders}
          scrollRef={scrollRef}
        />
      )}
    </div>
  )
}
