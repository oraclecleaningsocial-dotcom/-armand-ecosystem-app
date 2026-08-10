import { useMemo, useState } from 'react'
import Icon from './Icon'
import ReceiptRow from './ReceiptRow'
import { eur } from '../utils/format'

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

function toKey(d) {
  return d.toISOString().slice(0, 10)
}

export default function ReceiptCalendar({ receipts, onOpen, from = 'calendar' }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selected, setSelected] = useState(null)

  const byDay = useMemo(() => {
    const map = new Map()
    for (const r of receipts) {
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [receipts])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = (firstOfMonth.getDay() + 6) % 7 // lunedì = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out = []
    for (let i = 0; i < startOffset; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) out.push(new Date(year, month, day))
    return out
  }, [cursor])

  const todayKey = toKey(new Date())
  const monthLabel = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const selectedReceipts = selected ? (byDay.get(selected) || []) : []

  function changeMonth(delta) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    setSelected(null)
  }

  return (
    <div className="cal">
      <div className="cal-nav">
        <button className="cal-arrow" onClick={() => changeMonth(-1)} aria-label="Mese precedente"><Icon name="ChevronLeft" size={17} /></button>
        <span className="cal-month">{monthLabel}</span>
        <button className="cal-arrow" onClick={() => changeMonth(1)} aria-label="Mese successivo"><Icon name="ChevronRight" size={17} /></button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="cal-cell empty" />
          const key = toKey(d)
          const dayReceipts = byDay.get(key)
          const total = dayReceipts?.reduce((s, r) => s + r.total, 0)
          return (
            <button
              key={i}
              className={`cal-cell ${key === todayKey ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''} ${dayReceipts ? 'has-data' : ''}`}
              onClick={() => dayReceipts && setSelected(key === selected ? null : key)}
              disabled={!dayReceipts}
            >
              <span className="cal-daynum">{d.getDate()}</span>
              {dayReceipts && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="cal-day-panel">
          <p className="sect-label">
            {new Date(selected).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            {selectedReceipts.length > 0 && <span className="cal-day-total"> · {eur(selectedReceipts.reduce((s, r) => s + r.total, 0))}</span>}
          </p>
          <div className="list">
            {selectedReceipts.map((r) => <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen(id, from)} />)}
          </div>
        </div>
      )}
    </div>
  )
}
