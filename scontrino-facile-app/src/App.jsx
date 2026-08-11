import { useEffect, useState } from 'react'
import TabBar from './components/TabBar'
import Home from './screens/Home'
import Search from './screens/Search'
import CalendarScreen from './screens/CalendarScreen'
import Dashboard from './screens/Dashboard'
import Detail from './screens/Detail'
import Scan from './screens/Scan'
import Calculator from './screens/Calculator'
import LockScreen from './screens/LockScreen'
import { useReceipts } from './state'
import { isLockEnabled } from './utils/auth'

export default function App() {
  const [locked, setLocked] = useState(isLockEnabled)
  const { receipts, merchantCategoryMap, addReceipt, updateReceipt, deleteReceipt, categorize, replaceAll } = useReceipts()
  const [tab, setTab] = useState('home')
  const [screen, setScreen] = useState('home')
  const [detailId, setDetailId] = useState(null)
  const [detailBack, setDetailBack] = useState('home')
  const [toast, setToast] = useState('')
  const [searchPreset, setSearchPreset] = useState(null)

  // 100dvh non è affidabile in tutti i browser/PWA installate (alcune versioni di
  // iOS in modalità standalone lo calcolano male, "bloccando" la pagina): --app-height
  // è la misura reale del viewport, aggiornata a ogni resize/orientazione.
  useEffect(() => {
    function setAppHeight() {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
    }
    setAppHeight()
    window.addEventListener('resize', setAppHeight)
    window.addEventListener('orientationchange', setAppHeight)
    return () => {
      window.removeEventListener('resize', setAppHeight)
      window.removeEventListener('orientationchange', setAppHeight)
    }
  }, [])

  function navigate(target) {
    setScreen(target)
    if (['home', 'search', 'calendar', 'dashboard'].includes(target)) setTab(target)
  }

  function quickFilter(categoryId) {
    setSearchPreset(categoryId)
    navigate('search')
  }

  function openDetail(id, from) {
    setDetailId(id)
    setDetailBack(from)
    setScreen('detail')
  }

  function handleSave(draft) {
    addReceipt(draft)
    showToast('Ricevuta salvata')
    navigate('home')
  }

  function handleDelete(id) {
    deleteReceipt(id)
    showToast('Ricevuta eliminata')
    setScreen(detailBack)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  function handleRestore(newReceipts, newMap) {
    replaceAll(newReceipts, newMap)
    showToast('Backup ripristinato')
  }

  const activeReceipt = receipts.find((r) => r.id === detailId)

  if (locked) {
    return (
      <div className="app-shell">
        <div className="app-viewport">
          <LockScreen onUnlock={() => setLocked(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-viewport">
        {screen === 'home' && <Home receipts={receipts} onOpen={openDetail} onNavigate={navigate} onQuickFilter={quickFilter} />}
        {screen === 'search' && (
          <Search receipts={receipts} onOpen={openDetail} presetCategory={searchPreset} onConsumePreset={() => setSearchPreset(null)} />
        )}
        {screen === 'calendar' && <CalendarScreen receipts={receipts} onOpen={openDetail} />}
        {screen === 'dashboard' && (
          <Dashboard receipts={receipts} merchantCategoryMap={merchantCategoryMap} onRestore={handleRestore} />
        )}
        {screen === 'detail' && (
          <Detail receipt={activeReceipt} onBack={() => setScreen(detailBack)} onUpdate={updateReceipt} onDelete={handleDelete} />
        )}
        {screen === 'scan' && (
          <Scan categorize={categorize} onSave={handleSave} onCancel={() => navigate('home')} />
        )}
        {screen === 'calculator' && <Calculator onClose={() => setScreen(tab)} />}

        {['home', 'search', 'calendar', 'dashboard', 'detail'].includes(screen) && (
          <TabBar active={tab} onNavigate={navigate} />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}
