import Icon from '../components/Icon'
import ReceiptRow from '../components/ReceiptRow'
import { CATEGORIES } from '../categories'
import { eur } from '../utils/format'
import { last6MonthsTrend } from '../state'
import { useScrollRestore } from '../utils/scrollRestore'
import { useCountUp } from '../utils/useCountUp'
import { useI18n } from '../i18n'

export default function Home({ receipts, onOpen, onNavigate, onQuickFilter }) {
  const { t } = useI18n()
  const scrollRef = useScrollRestore('home')
  const trend = last6MonthsTrend(receipts)
  const current = trend[trend.length - 1].total
  const animatedCurrent = useCountUp(current)
  const previous = trend[trend.length - 2].total
  const up = current >= previous
  const pct = previous > 0 ? Math.round((Math.abs(current - previous) / previous) * 100) : 0
  const recent = receipts.slice(0, 5)

  return (
    <div className="screen" ref={scrollRef}>
      <div className="pad">
        <div className="hero-card">
          <div className="hero-actions">
            <button className="hero-icon-btn" onClick={() => onNavigate('cards')} aria-label={t('home.openCards')}>
              <Icon name="CreditCard" size={15} /> {t('home.cards')}
            </button>
            <button className="hero-icon-btn" onClick={() => onNavigate('calculator')} aria-label={t('home.openCalculator')}>
              <Icon name="Calculator" size={15} /> {t('home.calculator')}
            </button>
          </div>
          <p className="greet">{t('home.greeting')}</p>
          <h1 className="hero-total">{eur(animatedCurrent)}</h1>
          <p className="hero-caption">{t('home.spentThisMonth')}</p>
          {previous > 0 && (
            <span className={`delta ${up ? 'up' : 'down'}`}>
              {up ? '▲' : '▼'} {pct}% {t('home.vsLastMonth')}
            </span>
          )}
        </div>
      </div>

      <button className="cta-scan" onClick={() => onNavigate('scan')}>
        <span className="cta-scan-icon"><Icon name="Camera" size={17} strokeWidth={2.3} /></span>
        {t('nav.scanReceipt')}
      </button>

      <div className="quick-cats">
        {CATEGORIES.map((c) => (
          <button key={c.id} className="quick-cat" onClick={() => onQuickFilter(c.id)}>
            <span className="quick-cat-ic" style={{ background: `${c.color}33`, color: c.color }}>
              <Icon name={c.icon} size={18} />
            </span>
            <span>{t(`category.${c.id}`)}</span>
          </button>
        ))}
      </div>

      <div className="pad">
        <p className="sect-label">{t('home.recentReceipts')}</p>
      </div>
      {recent.length === 0 ? (
        <p className="empty">{t('home.noReceiptsYet')}</p>
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
