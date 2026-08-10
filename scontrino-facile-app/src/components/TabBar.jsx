import Icon from './Icon'

export default function TabBar({ active, onNavigate }) {
  return (
    <nav className="tabbar">
      <button className={`tab ${active === 'home' ? 'is-active' : ''}`} onClick={() => onNavigate('home')}>
        <Icon name="Home" size={20} />
        <span>Home</span>
      </button>
      <button className={`tab ${active === 'search' ? 'is-active' : ''}`} onClick={() => onNavigate('search')}>
        <Icon name="Search" size={20} />
        <span>Ricerca</span>
      </button>
      <button className="tab-scan" onClick={() => onNavigate('scan')} aria-label="Scansiona ricevuta">
        <Icon name="Camera" size={22} />
      </button>
      <button className={`tab ${active === 'calendar' ? 'is-active' : ''}`} onClick={() => onNavigate('calendar')}>
        <Icon name="Calendar" size={20} />
        <span>Calendario</span>
      </button>
      <button className={`tab ${active === 'dashboard' ? 'is-active' : ''}`} onClick={() => onNavigate('dashboard')}>
        <Icon name="PieChart" size={20} />
        <span>Report</span>
      </button>
    </nav>
  )
}
