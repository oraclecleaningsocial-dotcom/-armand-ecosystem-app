import { useState } from 'react'
import TabBar from './components/TabBar'
import Home from './screens/Home'
import Search from './screens/Search'
import CalendarScreen from './screens/CalendarScreen'
import Dashboard from './screens/Dashboard'
import Detail from './screens/Detail'
import Scan from './screens/Scan'
import { useReceipts } from './state'

export default function App() {
  const { receipts, merchantCategoryMap, addReceipt, updateReceipt, deleteReceipt, categorize, replaceAll } = useReceipts()
  const [tab, setTab] = useState('home')
  const [screen, setScreen] = useState('home')
  const [detailId, setDetailId] = useState(null)
  const [detailBack, setDetailBack] = useState('home')
  const [toast, setToast] = useState('')

  function navigate(target) {
    setScreen(target)
    if (['home', 'search', 'calendar', 'dashboard'].includes(target)) setTab(target)
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

  return (
    <div className="app-shell">
      <div className="app-viewport">
        {screen === 'home' && <Home receipts={receipts} onOpen={openDetail} onNavigate={navigate} />}
        {screen === 'search' && <Search receipts={receipts} onOpen={openDetail} />}
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

        {['home', 'search', 'calendar', 'dashboard', 'detail'].includes(screen) && (
          <TabBar active={tab} onNavigate={navigate} />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}
