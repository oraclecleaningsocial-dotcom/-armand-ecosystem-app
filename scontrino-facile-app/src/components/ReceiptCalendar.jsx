import { useMemo, useState } from 'react'
import Icon from './Icon'
import ReceiptRow from './ReceiptRow'
import { eur } from '../utils/format'

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const VIEW_MODES = [
  { id: 'month', label: 'Mese' },
  { id: 'week', label: 'Settimana' },
  { id: 'year', label: 'Anno' },
]

function toKey(d) {
  return d.toISOString().slice(0, 10)
}

function startOfWeek(d) {
  const offset = (d.getDay() + 6) % 7 // lunedì = 0
  const out = new Date(d)
  out.setDate(d.getDate() - offset)
  out.setHours(0, 0, 0, 0)
  return out
}

export default function ReceiptCalendar({ receipts, onOpen, from = 'calendar', reminders = [], onAddReminder, onDeleteReminder }) {
  const [viewMode, setViewMode] = useState('month')
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [selected, setSelected] = useState(null)
  const [reminderTitle, setReminderTitle] = useState('')

  const byDay = useMemo(() => {
    const map = new Map()
    for (const r of receipts) {
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [receipts])

  const remindersByDay = useMemo(() => {
    const map = new Map()
    for (const r of reminders) {
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [reminders])

  const monthCells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out = []
    for (let i = 0; i < startOffset; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) out.push(new Date(year, month, day))
    return out
  }, [cursor])

  const weekCells = useMemo(() => {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const yearMonths = useMemo(() => {
    const year = cursor.getFullYear()
    return Array.from({ length: 12 }, (_, m) => {
      let total = 0
      let count = 0
      for (const r of receipts) {
        const d = new Date(r.date)
        if (d.getFullYear() === year && d.getMonth() === m) { total += r.total; count += 1 }
      }
      return { m, total, count }
    })
  }, [receipts, cursor])

  const todayKey = toKey(new Date())
  const selectedReceipts = selected ? (byDay.get(selected) || []) : []
  const selectedReminders = selected ? (remindersByDay.get(selected) || []) : []

  function changeMonth(delta) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    setSelected(null)
  }
  function changeWeek(delta) {
    setCursor((prev) => { const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d })
    setSelected(null)
  }
  function changeYear(delta) {
    setCursor((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1))
    setSelected(null)
  }

  function goPrev() {
    if (viewMode === 'month') changeMonth(-1)
    else if (viewMode === 'week') changeWeek(-1)
    else changeYear(-1)
  }
  function goNext() {
    if (viewMode === 'month') changeMonth(1)
    else if (viewMode === 'week') changeWeek(1)
    else changeYear(1)
  }

  function pickMonth(m) {
    setCursor(new Date(cursor.getFullYear(), m, 1))
    setViewMode('month')
  }

  function goToday() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setCursor(d)
    setSelected(toKey(d))
  }

  function switchMode(id) {
    setViewMode(id)
    setSelected(null)
  }

  function selectDay(key) {
    setSelected((prev) => (prev === key ? null : key))
    setReminderTitle('')
  }

  function submitReminder(e) {
    e.preventDefault()
    if (!reminderTitle.trim() || !selected) return
    onAddReminder?.({ date: selected, title: reminderTitle.trim() })
    setReminderTitle('')
  }

  let headerLabel
  if (viewMode === 'month') {
    headerLabel = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  } else if (viewMode === 'year') {
    headerLabel = String(cursor.getFullYear())
  } else {
    const start = weekCells[0]
    const end = weekCells[6]
    headerLabel = start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString('it-IT', { month: 'long' })}`
      : `${start.getDate()} ${start.toLocaleDateString('it-IT', { month: 'short' })} – ${end.getDate()} ${end.toLocaleDateString('it-IT', { month: 'short' })}`
  }

  return (
    <div className="cal">
      <div className="cal-modes">
        {VIEW_MODES.map((v) => (
          <button key={v.id} className={`cal-mode ${viewMode === v.id ? 'is-active' : ''}`} onClick={() => switchMode(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="cal-nav">
        <button className="cal-arrow" onClick={goPrev} aria-label="Precedente"><Icon name="ChevronLeft" size={17} /></button>
        <span className="cal-month">{headerLabel}</span>
        <div className="cal-nav-right">
          <button className="cal-today-btn" onClick={goToday}>Oggi</button>
          <button className="cal-arrow" onClick={goNext} aria-label="Successivo"><Icon name="ChevronRight" size={17} /></button>
        </div>
      </div>

      {viewMode === 'year' ? (
        <div className="cal-year-grid">
          {yearMonths.map(({ m, total, count }) => (
            <button key={m} className={`cal-year-cell ${count > 0 ? 'has-data' : ''}`} onClick={() => pickMonth(m)}>
              <span className="cal-year-month">{MONTHS_SHORT[m]}</span>
              <span className="cal-year-total">{count > 0 ? eur(total) : '—'}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="cal-weekdays">
            {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
          </div>

          <div className="cal-grid">
            {(viewMode === 'week' ? weekCells : monthCells).map((d, i) => {
              if (!d) return <span key={i} className="cal-cell empty" />
              const key = toKey(d)
              const dayReceipts = byDay.get(key)
              const dayReminders = remindersByDay.get(key)
              return (
                <button
                  key={i}
                  className={`cal-cell ${key === todayKey ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''} ${dayReceipts ? 'has-data' : ''}`}
                  onClick={() => selectDay(key)}
                >
                  <span className="cal-daynum">{d.getDate()}</span>
                  <span className="cal-dots">
                    {dayReceipts && <span className="cal-dot" />}
                    {dayReminders && <span className="cal-dot reminder" />}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {selected && (
        <div className="cal-day-panel">
          <p className="sect-label">
            {new Date(selected).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            {selectedReceipts.length > 0 && <span className="cal-day-total"> · {eur(selectedReceipts.reduce((s, r) => s + r.total, 0))}</span>}
          </p>

          {selectedReceipts.length > 0 && (
            <div className="list">
              {selectedReceipts.map((r) => <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen(id, from)} />)}
            </div>
          )}

          <p className="sect-label reminders-label"><Icon name="Bell" size={12} /> Promemoria</p>
          {selectedReminders.length > 0 && (
            <div className="reminder-list">
              {selectedReminders.map((r) => (
                <div className="reminder-row" key={r.id}>
                  <span>{r.title}</span>
                  <button onClick={() => onDeleteReminder?.(r.id)} aria-label="Elimina promemoria"><Icon name="X" size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <form className="reminder-add" onSubmit={submitReminder}>
            <input
              placeholder="Aggiungi promemoria…"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
            />
            <button type="submit" aria-label="Aggiungi"><Icon name="Plus" size={15} /></button>
          </form>
        </div>
      )}
    </div>
  )
}
