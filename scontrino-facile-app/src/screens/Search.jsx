import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import ReceiptRow from '../components/ReceiptRow'
import ReceiptCalendar from '../components/ReceiptCalendar'
import { CATEGORIES } from '../categories'
import { normalizeMerchant } from '../categories'

export default function Search({ receipts, onOpen }) {
  const [query, setQuery] = useState('')
  const [activeCats, setActiveCats] = useState(new Set())
  const [view, setView] = useState('list') // list | calendar

  const results = useMemo(() => {
    const q = normalizeMerchant(query)
    return receipts.filter((r) => {
      const matchesQuery =
        !q ||
        normalizeMerchant(r.merchant).includes(q) ||
        r.items.some((it) => normalizeMerchant(it.name).includes(q))
      const matchesCategory = activeCats.size === 0 || activeCats.has(r.category)
      return matchesQuery && matchesCategory
    })
  }, [receipts, query, activeCats])

  function toggleCat(id) {
    setActiveCats((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="screen">
      <div className="pad" style={{ paddingTop: 6 }}>
        <div className="search-box">
          <Icon name="Search" size={17} className="muted-ic" />
          <input
            autoFocus
            placeholder="Cerca negozio o voce…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip ${activeCats.has(c.id) ? 'is-active' : ''}`}
            style={activeCats.has(c.id) ? { borderColor: c.color, background: `${c.color}1c`, color: c.color } : undefined}
            onClick={() => toggleCat(c.id)}
          >
            <Icon name={c.icon} size={13} /> {c.label}
          </button>
        ))}
      </div>

      <div className="pad view-row">
        <p className="sect-label" style={{ margin: 0 }}>{results.length} {results.length === 1 ? 'ricevuta' : 'ricevute'}</p>
        <div className="view-toggle">
          <button className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="Vista elenco">
            <Icon name="List" size={15} />
          </button>
          <button className={view === 'calendar' ? 'is-active' : ''} onClick={() => setView('calendar')} aria-label="Vista calendario">
            <Icon name="Calendar" size={15} />
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <ReceiptCalendar receipts={results} onOpen={onOpen} />
      ) : results.length === 0 ? (
        <p className="empty">Nessuna ricevuta trovata.</p>
      ) : (
        <div className="list">
          {results.map((r) => (
            <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen(id, 'search')} />
          ))}
        </div>
      )}
    </div>
  )
}
