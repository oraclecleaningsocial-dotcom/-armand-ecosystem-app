import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import ReceiptRow from '../components/ReceiptRow'
import { CATEGORIES } from '../categories'
import { normalizeMerchant } from '../categories'

export default function Search({ receipts, onOpen, presetCategory, onConsumePreset }) {
  const [query, setQuery] = useState('')
  const [activeCats, setActiveCats] = useState(() => (presetCategory ? new Set([presetCategory]) : new Set()))

  useEffect(() => {
    if (presetCategory) onConsumePreset?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <div className="pad" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 18px)' }}>
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
            style={activeCats.has(c.id) ? { borderColor: c.color, background: `${c.color}33`, color: c.color } : undefined}
            onClick={() => toggleCat(c.id)}
          >
            <Icon name={c.icon} size={13} /> {c.label}
          </button>
        ))}
      </div>

      <div className="pad">
        <p className="sect-label">{results.length} {results.length === 1 ? 'ricevuta' : 'ricevute'}</p>
      </div>

      {results.length === 0 ? (
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
