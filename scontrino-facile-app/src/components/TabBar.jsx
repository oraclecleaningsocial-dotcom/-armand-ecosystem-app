import Icon from './Icon'
import { useI18n } from '../i18n'

export default function TabBar({ active, onNavigate }) {
  const { t } = useI18n()
  return (
    <nav className="tabbar">
      <button className={`tab tab-home ${active === 'home' ? 'is-active' : ''}`} onClick={() => onNavigate('home')}>
        <span className="tab-ic"><Icon name="Home" size={20} /></span>
        <span>{t('nav.home')}</span>
      </button>
      <button className={`tab tab-search ${active === 'search' ? 'is-active' : ''}`} onClick={() => onNavigate('search')}>
        <span className="tab-ic"><Icon name="Search" size={20} /></span>
        <span>{t('nav.search')}</span>
      </button>
      <button className="tab-scan" onClick={() => onNavigate('scan')} aria-label={t('nav.scanReceipt')}>
        <Icon name="Camera" size={22} />
      </button>
      <button className={`tab tab-calendar ${active === 'calendar' ? 'is-active' : ''}`} onClick={() => onNavigate('calendar')}>
        <span className="tab-ic"><Icon name="Calendar" size={20} /></span>
        <span>{t('nav.calendar')}</span>
      </button>
      <button className={`tab tab-dashboard ${active === 'dashboard' ? 'is-active' : ''}`} onClick={() => onNavigate('dashboard')}>
        <span className="tab-ic"><Icon name="PieChart" size={20} /></span>
        <span>{t('nav.report')}</span>
      </button>
    </nav>
  )
}
