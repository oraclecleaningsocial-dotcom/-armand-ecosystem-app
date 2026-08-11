import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import ReceiptRow from '../components/ReceiptRow'
import TrendChart from '../components/TrendChart'
import { CATEGORY_MAP } from '../categories'
import { eur } from '../utils/format'
import { last6MonthsTrend, totalsByPeriod } from '../state'
import { downloadCsv, receiptsToCsv } from '../utils/csv'
import CurrencyWidget from '../components/CurrencyWidget'
import NotesWidget from '../components/NotesWidget'
import TodoWidget from '../components/TodoWidget'
import { useScrollRestore } from '../utils/scrollRestore'
import { useCountUp } from '../utils/useCountUp'

export default function Dashboard({
  receipts, onNavigate, onOpen, notes, onAddNote, onDeleteNote, todos, onAddTodo, onToggleTodo, onDeleteTodo,
}) {
  const scrollRef = useScrollRestore('dashboard')
  const now = new Date()
  const [period] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [expandedCat, setExpandedCat] = useState(null)
  const { total, byCategory, receipts: periodReceipts } = useMemo(() => totalsByPeriod(receipts, period), [receipts, period])
  const animatedTotal = useCountUp(total)
  const trend = useMemo(() => last6MonthsTrend(receipts), [receipts])
  const previous = trend[trend.length - 2]?.total ?? 0
  const up = total >= previous
  const pct = previous > 0 ? Math.round((Math.abs(total - previous) / previous) * 100) : 0

  const breakdown = Object.entries(byCategory)
    .map(([id, amount]) => ({ id, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0, cat: CATEGORY_MAP[id] }))
    .sort((a, b) => b.amount - a.amount)

  let acc = 0
  const gradientStops = breakdown.map(({ amount, cat }) => {
    const start = (acc / total) * 360
    acc += amount
    const end = (acc / total) * 360
    return `${cat.color} ${start}deg ${end}deg`
  })

  const monthName = new Date(period.year, period.month).toLocaleDateString('it-IT', { month: 'long' })
  const expandedReceipts = expandedCat ? periodReceipts.filter((r) => r.category === expandedCat) : []

  function exportCsv() {
    const csv = receiptsToCsv(periodReceipts, (id) => CATEGORY_MAP[id]?.label || id)
    downloadCsv(`scontrinofacile-${monthName}-${period.year}.csv`, csv)
  }

  function toggleCat(id) {
    setExpandedCat((prev) => (prev === id ? null : id))
  }

  return (
    <div className="screen" ref={scrollRef}>
      <div className="pad dash-head">
        <h1 className="scr-title">Report</h1>
        <span className="period-pill">{monthName} {period.year}</span>
      </div>

      <div className="pad">
        <div className="report-hero-card">
          <span className="report-hero-label">Speso questo mese</span>
          <h2 className="hero-total sm">{eur(animatedTotal)}</h2>
          {previous > 0 && (
            <span className={`delta ${up ? 'up' : 'down'}`}>
              {up ? '▲' : '▼'} {pct}% rispetto al mese scorso
            </span>
          )}
        </div>
      </div>

      {total === 0 ? (
        <p className="empty">Ancora nessuna spesa questo mese.</p>
      ) : (
        <>
          <div className="pad donut-row centered">
            <div className="donut" style={{ background: `conic-gradient(${gradientStops.join(',')})` }}>
              <div className="donut-hole">
                <b>{eur(total)}</b>
                <span>totale</span>
              </div>
            </div>
          </div>

          <div className="pad cat-grid">
            {breakdown.map(({ id, amount, pct, cat }, i) => {
              // La categoria con la spesa più alta del mese si distingue con una card a
              // tinta piena (invece del solito sfondo scuro traslucido) e più larga —
              // il tratto "un riquadro pieno di colore spicca tra gli altri" preso dal
              // tema a mosaico condiviso come ispirazione.
              const featured = i === 0
              return (
                <button
                  className={`cat-card ${expandedCat === id ? 'is-selected' : ''} ${featured ? 'is-featured' : ''}`}
                  key={id}
                  style={featured
                    ? { background: `linear-gradient(135deg, ${cat.color}, color-mix(in srgb, ${cat.color} 60%, black))` }
                    : { background: `${cat.color}2e` }}
                  onClick={() => toggleCat(id)}
                >
                  <span
                    className="cat-card-ic"
                    style={featured ? { background: 'rgba(255,255,255,.24)', color: '#fff' } : { background: `${cat.color}45`, color: cat.color }}
                  >
                    <Icon name={cat.icon} size={featured ? 20 : 16} />
                  </span>
                  <span className="cat-card-label" style={featured ? { color: 'rgba(255,255,255,.85)' } : undefined}>{cat.label}</span>
                  <span className="cat-card-amt" style={featured ? { color: '#fff' } : undefined}>{eur(amount)}</span>
                  <span className="cat-card-pct" style={{ color: featured ? '#fff' : cat.color }}>{pct}%</span>
                </button>
              )
            })}
          </div>

          <div className={`cat-expand ${expandedCat ? 'is-open' : ''}`}>
            <div className="cat-expand-inner">
              {expandedCat && (
                <div className="pad">
                  <p className="sect-label" style={{ margin: '0 0 10px' }}>
                    Scontrini · {CATEGORY_MAP[expandedCat]?.label}
                  </p>
                  {expandedReceipts.length === 0 ? (
                    <p className="empty">Nessuno scontrino in questa categoria.</p>
                  ) : (
                    <div className="list list-cards">
                      {expandedReceipts.map((r) => (
                        <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen?.(id, 'dashboard')} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="pad trend-block">
        <p className="sect-label">Andamento ultimi 6 mesi</p>
        <div className="trend-card">
          <TrendChart data={trend} />
          <div className="trend-labels">
            {trend.map((t) => <span key={`${t.year}-${t.month}`}>{t.label}</span>)}
          </div>
        </div>
      </div>

      <button className="export-btn" onClick={exportCsv} disabled={periodReceipts.length === 0}>
        <Icon name="Download" size={16} /> Esporta riepilogo (.csv)
      </button>

      <div className="pad tools-block">
        <p className="sect-label">Strumenti</p>
        <div className="tool-cards">
          <button className="tool-card" onClick={() => onNavigate?.('calculator')}>
            <span className="tool-card-ic"><Icon name="Calculator" size={19} /></span>
            Calcolatrice
          </button>
          <button className="tool-card" onClick={() => onNavigate?.('vault')}>
            <span className="tool-card-ic"><Icon name="Lock" size={19} /></span>
            Documenti
          </button>
          <button className="tool-card" onClick={() => onNavigate?.('fiscal')}>
            <span className="tool-card-ic"><Icon name="Landmark" size={19} /></span>
            Scadenze fiscali
          </button>
          <button className="tool-card" onClick={() => onNavigate?.('settings')}>
            <span className="tool-card-ic"><Icon name="Settings" size={19} /></span>
            Impostazioni
          </button>
          <button className="tool-card" onClick={() => onNavigate?.('products')}>
            <span className="tool-card-ic"><Icon name="ScanBarcode" size={19} /></span>
            Prodotti
          </button>
          <button className="tool-card" onClick={() => onNavigate?.('tickets')}>
            <span className="tool-card-ic"><Icon name="Ticket" size={19} /></span>
            Biglietti
          </button>
          <button className="tool-card" onClick={() => onNavigate?.('cards')}>
            <span className="tool-card-ic"><Icon name="CreditCard" size={19} /></span>
            Carte
          </button>
        </div>
      </div>

      <div className="pad widgets-block">
        <p className="sect-label"><Icon name="LayoutGrid" size={13} /> Widget</p>
        <TodoWidget todos={todos} onAddTodo={onAddTodo} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo} />
        <NotesWidget notes={notes} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />
        <CurrencyWidget />
      </div>
    </div>
  )
}
