import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { CATEGORY_MAP } from '../categories'
import { eur } from '../utils/format'
import { last6MonthsTrend, totalsByPeriod } from '../state'
import { downloadCsv, receiptsToCsv } from '../utils/csv'

export default function Dashboard({ receipts }) {
  const now = new Date()
  const [period] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const { total, byCategory, receipts: periodReceipts } = useMemo(() => totalsByPeriod(receipts, period), [receipts, period])
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

  const maxTrend = Math.max(1, ...trend.map((t) => t.total))
  const monthName = new Date(period.year, period.month).toLocaleDateString('it-IT', { month: 'long' })

  function exportCsv() {
    const csv = receiptsToCsv(periodReceipts, (id) => CATEGORY_MAP[id]?.label || id)
    downloadCsv(`scontrinofacile-${monthName}-${period.year}.csv`, csv)
  }

  return (
    <div className="screen">
      <div className="pad dash-head">
        <h1 className="scr-title">Report</h1>
        <span className="period-pill">{monthName} {period.year}</span>
      </div>

      <div className="pad">
        <h2 className="hero-total sm">{eur(total)}</h2>
        {previous > 0 && (
          <span className={`delta ${up ? 'up' : 'down'}`}>
            {up ? '▲' : '▼'} {pct}% rispetto al mese scorso
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="empty">Ancora nessuna spesa questo mese.</p>
      ) : (
        <div className="pad donut-row">
          <div className="donut" style={{ background: `conic-gradient(${gradientStops.join(',')})` }}>
            <div className="donut-hole">
              <b>{eur(total)}</b>
              <span>totale</span>
            </div>
          </div>
          <div className="legend">
            {breakdown.map(({ id, amount, pct, cat }) => (
              <div className="legend-row" key={id}>
                <span className="legend-sw" style={{ background: cat.color }} />
                <span className="legend-name"><Icon name={cat.icon} size={13} /> {cat.label}</span>
                <span className="legend-amt">{eur(amount)} · {pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pad trend-block">
        <p className="sect-label">Andamento ultimi 6 mesi</p>
        <div className="bars">
          {trend.map((t, i) => {
            const isNow = i === trend.length - 1
            return (
              <div className="bar-col" key={`${t.year}-${t.month}`}>
                {isNow && <span className="bar-val">{Math.round(t.total)}</span>}
                <div className={`bar ${isNow ? 'is-now' : ''}`} style={{ height: `${Math.max(4, (t.total / maxTrend) * 100)}%` }} />
                <span className="bar-label">{t.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <button className="export-btn" onClick={exportCsv} disabled={periodReceipts.length === 0}>
        <Icon name="Download" size={16} /> Esporta riepilogo (.csv)
      </button>
    </div>
  )
}
