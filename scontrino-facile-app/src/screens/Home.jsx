import Icon from '../components/Icon'
import ReceiptRow from '../components/ReceiptRow'
import { CATEGORIES } from '../categories'
import { eur } from '../utils/format'
import { last6MonthsTrend } from '../state'
import { useScrollRestore } from '../utils/scrollRestore'

export default function Home({ receipts, onOpen, onNavigate, onQuickFilter }) {
  const scrollRef = useScrollRestore('home')
  const trend = last6MonthsTrend(receipts)
  const current = trend[trend.length - 1].total
  const previous = trend[trend.length - 2].total
  const up = current >= previous
  const pct = previous > 0 ? Math.round((Math.abs(current - previous) / previous) * 100) : 0
  const recent = receipts.slice(0, 5)

  return (
    <div className="screen" ref={scrollRef}>
      <div className="pad">
        <div className="hero-card">
          <button className="hero-icon-btn" onClick={() => onNavigate('calculator')} aria-label="Apri calcolatrice">
            <Icon name="Calculator" size={15} /> Calcolatrice
          </button>
          <p className="greet">Ciao 👋</p>
          <h1 className="hero-total">{eur(current)}</h1>
          <p className="hero-caption">speso questo mese</p>
          {previous > 0 && (
            <span className={`delta ${up ? 'up' : 'down'}`}>
              {up ? '▲' : '▼'} {pct}% rispetto al mese scorso
            </span>
          )}
        </div>
      </div>

      <button className="cta-scan" onClick={() => onNavigate('scan')}>
        <span className="cta-scan-icon"><Icon name="Camera" size={17} strokeWidth={2.3} /></span>
        Scansiona ricevuta
      </button>

      <div className="quick-cats">
        {CATEGORIES.map((c) => (
          <button key={c.id} className="quick-cat" onClick={() => onQuickFilter(c.id)}>
            <span className="quick-cat-ic" style={{ background: `${c.color}33`, color: c.color }}>
              <Icon name={c.icon} size={18} />
            </span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="pad">
        <p className="sect-label">Ricevute recenti</p>
      </div>
      {recent.length === 0 ? (
        <p className="empty">Nessuna ricevuta ancora. Scansionane una per iniziare.</p>
      ) : (
        <div className="list list-cards">
          {recent.map((r) => (
            <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen(id, 'home')} />
          ))}
        </div>
      )}
    </div>
  )
}
