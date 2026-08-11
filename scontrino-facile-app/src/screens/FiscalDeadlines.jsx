import { useMemo } from 'react'
import Icon from '../components/Icon'
import { getUpcomingDeadlines } from '../fiscalDeadlines'
import { formatDate } from '../utils/format'

function daysLabel(days) {
  if (days === 0) return 'oggi'
  if (days === 1) return 'domani'
  if (days > 1) return `tra ${days} giorni`
  return 'in corso'
}

export default function FiscalDeadlines({ onClose }) {
  const deadlines = useMemo(() => getUpcomingDeadlines(), [])

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> Indietro</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">Scadenze fiscali</h1>
        <p className="backup-hint">
          Le scadenze più comuni per le persone fisiche in Italia, calcolate automaticamente sulle date di riferimento.
          Sono indicative: verificale sempre sul sito dell'Agenzia delle Entrate per il tuo caso specifico.
        </p>

        <div className="fiscal-list">
          {deadlines.map((d) => (
            <div className={`fiscal-card ${d.active ? 'is-active' : ''}`} key={d.id}>
              <span className="fiscal-card-ic"><Icon name="Landmark" size={18} /></span>
              <div className="fiscal-card-text">
                <b>{d.title}</b>
                <span className="fiscal-card-date">
                  {d.isRange
                    ? `${formatDate(d.start)} – ${formatDate(d.end)}`
                    : formatDate(d.date)}
                  {' · '}
                  {d.active ? 'in corso ora' : daysLabel(d.daysUntil)}
                </span>
                <span className="fiscal-card-desc">{d.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
