import { useMemo } from 'react'
import Icon from '../components/Icon'
import { getUpcomingDeadlines } from '../fiscalDeadlines'
import { formatDate } from '../utils/format'
import { useI18n } from '../i18n'

export default function FiscalDeadlines({ onClose }) {
  const { t } = useI18n()
  const deadlines = useMemo(() => getUpcomingDeadlines(), [])

  function daysLabel(days) {
    if (days === 0) return t('fiscal.today')
    if (days === 1) return t('fiscal.tomorrow')
    if (days > 1) return t('fiscal.inDays', { n: days })
    return t('fiscal.ongoing')
  }

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> {t('common.back')}</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">{t('fiscal.title')}</h1>
        <p className="backup-hint">{t('fiscal.description')}</p>

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
                  {d.active ? t('fiscal.ongoingNow') : daysLabel(d.daysUntil)}
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
