import Icon from './Icon'
import { useI18n } from '../i18n'

export default function TabBar({ active, onNavigate }) {
  const { t } = useI18n()
  return (
    <nav className="tabbar">
      <button className={`tab ${active === 'home' ? 'is-active' : ''}`} onClick={() => onNavigate('home')}>
        <Icon name="Home" size={20} />
        <span>{t('nav.home')}</span>
      </button>
      <button className={`tab ${active === 'search' ? 'is-active' : ''}`} onClick={() => onNavigate('search')}>
        <Icon name="Search" size={20} />
        <span>{t('nav.search')}</span>
      </button>
      <button className="tab-scan" onClick={() => onNavigate('scan')} aria-label={t('nav.scanReceipt')}>
        <Icon name="Camera" size={22} />
      </button>
      <button className={`tab ${active === 'calendar' ? 'is-active' : ''}`} onClick={() => onNavigate('calendar')}>
        <Icon name="Calendar" size={20} />
        <span>{t('nav.calendar')}</span>
      </button>
      <button className={`tab ${active === 'dashboard' ? 'is-active' : ''}`} onClick={() => onNavigate('dashboard')}>
        <Icon name="PieChart" size={20} />
        <span>{t('nav.report')}</span>
      </button>
    </nav>
  )
}
