import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import ReceiptCalendar from '../components/ReceiptCalendar'
import ReceiptRow from '../components/ReceiptRow'
import { eur } from '../utils/format'

export default function CalendarScreen({ receipts, onOpen }) {
  const [rangeOpen, setRangeOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const rangeResults = useMemo(() => {
    if (!from && !to) return null
    return receipts
      .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [receipts, from, to])

  const rangeTotal = rangeResults ? rangeResults.reduce((s, r) => s + r.total, 0) : 0

  function toggleRange() {
    setRangeOpen((v) => !v)
  }

  return (
    <div className="screen">
      <div className="pad cal-screen-head" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 18px)' }}>
        <h1 className="scr-title">Calendario</h1>
        <button className="cal-search-btn" onClick={toggleRange} aria-label={rangeOpen ? 'Chiudi ricerca per intervallo' : 'Cerca per intervallo di date'}>
          <Icon name={rangeOpen ? 'X' : 'Search'} size={17} />
        </button>
      </div>

      {rangeOpen ? (
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
      ) : (
        <ReceiptCalendar receipts={receipts} onOpen={onOpen} />
      )}
    </div>
  )
}
