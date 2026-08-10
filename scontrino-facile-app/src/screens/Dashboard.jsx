import { useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { CATEGORY_MAP } from '../categories'
import { eur } from '../utils/format'
import { last6MonthsTrend, totalsByPeriod } from '../state'
import { downloadCsv, receiptsToCsv } from '../utils/csv'
import { downloadJson, parseBackup, serializeBackup } from '../utils/backup'

export default function Dashboard({ receipts, merchantCategoryMap, onRestore }) {
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

  function exportBackup() {
    const json = serializeBackup(receipts, merchantCategoryMap)
    downloadJson(`scontrinofacile-backup-${new Date().toISOString().slice(0, 10)}.json`, json)
  }

  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState('')

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const { receipts: importedReceipts, merchantCategoryMap: importedMap } = parseBackup(text)
      const ok = window.confirm(
        `Ripristinare questo backup sostituirà tutte le ${receipts.length} ricevute attuali con le ${importedReceipts.length} del file. Continuare?`,
      )
      if (ok) onRestore(importedReceipts, importedMap)
    } catch (err) {
      setImportError(err.message || 'Backup non valido.')
    }
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
            {breakdown.map(({ id, amount, pct, cat }) => (
              <div className="cat-card" key={id} style={{ background: `${cat.color}18` }}>
                <span className="cat-card-ic" style={{ background: `${cat.color}2a`, color: cat.color }}>
                  <Icon name={cat.icon} size={16} />
                </span>
                <span className="cat-card-label">{cat.label}</span>
                <span className="cat-card-amt">{eur(amount)}</span>
                <span className="cat-card-pct" style={{ color: cat.color }}>{pct}%</span>
              </div>
            ))}
          </div>
        </>
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

      <div className="pad backup-block">
        <p className="sect-label">Backup dati</p>
        <p className="backup-hint">I dati restano solo su questo dispositivo. Esporta un backup ogni tanto per non perderli.</p>
        <div className="backup-actions">
          <button className="btn" onClick={exportBackup} disabled={receipts.length === 0}>
            <Icon name="Download" size={15} /> Esporta backup
          </button>
          <label className="btn">
            <Icon name="Upload" size={15} /> Importa backup
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} hidden />
          </label>
        </div>
        {importError && <p className="notice">{importError}</p>}
      </div>
    </div>
  )
}
