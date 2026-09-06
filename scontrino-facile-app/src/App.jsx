import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import TabBar from './components/TabBar'
import Home from './screens/Home'
import Search from './screens/Search'
import CalendarScreen from './screens/CalendarScreen'
import Dashboard from './screens/Dashboard'
import Detail from './screens/Detail'
import Scan from './screens/Scan'
import Calculator from './screens/Calculator'
import LockScreen from './screens/LockScreen'
import VaultScreen from './screens/VaultScreen'
import FiscalDeadlines from './screens/FiscalDeadlines'
import Settings from './screens/Settings'
import Products from './screens/Products'
import Tickets from './screens/Tickets'
import LoyaltyCards from './screens/LoyaltyCards'
import { useReceipts } from './state'
import { useReminders } from './reminders'
import { useNotes } from './notes'
import { useTodos } from './todos'
import { isLockEnabled } from './utils/auth'
import { onStorageError } from './utils/storageAlert'
import { useUpdateChecker } from './utils/updateChecker'
import { useI18n } from './i18n'
import Icon from './components/Icon'

// Cambio schermata con la View Transitions API nativa del browser (Safari 18+/iOS 18+,
// Chrome/Edge recenti): invece del solo fade in dissolvenza della singola schermata in
// montaggio, il browser cattura un fermo immagine di "prima" e "dopo" e li sfuma/scala
// l'uno nell'altro a livello dell'intera pagina — l'effetto "cambio schermata da app
// vera" che un fade CSS sul singolo componente non può dare da solo. flushSync forza
// l'aggiornamento di stato React a essere sincrono dentro il callback, come richiesto
// dall'API per poter catturare il "dopo" nello stesso istante. Nessun errore se il
// browser non la supporta (Firefox, iOS più vecchi) o se l'utente ha ridotto le
// animazioni: si applica semplicemente l'aggiornamento di stato senza transizione.
function withViewTransition(updateFn) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || typeof document.startViewTransition !== 'function') {
    updateFn()
    return
  }
  document.startViewTransition(() => flushSync(updateFn))
}

export default function App() {
  const { t } = useI18n()
  const updateAvailable = useUpdateChecker()
  const [locked, setLocked] = useState(isLockEnabled)
  const { receipts, merchantCategoryMap, addReceipt, updateReceipt, deleteReceipt, categorize, replaceAll } = useReceipts()
  const { reminders, addReminder, deleteReminder } = useReminders()
  const { notes, addNote, deleteNote } = useNotes()
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos()
  const [tab, setTab] = useState('home')
  const [screen, setScreen] = useState('home')
  const [detailId, setDetailId] = useState(null)
  const [detailBack, setDetailBack] = useState('home')
  const [toast, setToast] = useState('')
  const [searchPreset, setSearchPreset] = useState(null)

  function navigate(target) {
    withViewTransition(() => {
      setScreen(target)
      if (['home', 'search', 'calendar', 'dashboard'].includes(target)) setTab(target)
    })
  }

  function quickFilter(categoryId) {
    setSearchPreset(categoryId)
    navigate('search')
  }

  function openDetail(id, from) {
    withViewTransition(() => {
      setDetailId(id)
      setDetailBack(from)
      setScreen('detail')
    })
  }

  function handleSave(draft) {
    addReceipt(draft)
    showToast('Ricevuta salvata')
    navigate('home')
  }

  function handleDelete(id) {
    deleteReceipt(id)
    showToast('Ricevuta eliminata')
    withViewTransition(() => setScreen(detailBack))
  }

  function showToast(msg, duration = 2200) {
    setToast(msg)
    setTimeout(() => setToast(''), duration)
  }

  // Un salvataggio fallito per spazio esaurito (localStorage pieno) veniva prima ignorato
  // in silenzio da ogni modulo di stato — l'utente lo scopriva solo alla riapertura
  // dell'app, con dati mancanti. Con questo almeno lo sa subito.
  useEffect(() => {
    return onStorageError(() => showToast(
      'Spazio di archiviazione pieno: alcuni dati potrebbero non essere salvati. Vai in Impostazioni ed esporta un backup, poi elimina scontrini o documenti vecchi.',
      4500,
    ))
  }, [])

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
        {screen === 'calendar' && (
          <CalendarScreen receipts={receipts} onOpen={openDetail} reminders={reminders} onAddReminder={addReminder} onDeleteReminder={deleteReminder} />
        )}
        {screen === 'dashboard' && (
          <Dashboard
            receipts={receipts}
            merchantCategoryMap={merchantCategoryMap}
            onRestore={handleRestore}
            onNavigate={navigate}
            onOpen={openDetail}
            notes={notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            todos={todos}
            onAddTodo={addTodo}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
          />
        )}
        {screen === 'detail' && (
          <Detail receipt={activeReceipt} onBack={() => withViewTransition(() => setScreen(detailBack))} onUpdate={updateReceipt} onDelete={handleDelete} />
        )}
        {screen === 'scan' && (
          <Scan categorize={categorize} onSave={handleSave} onCancel={() => navigate('home')} />
        )}
        {screen === 'calculator' && <Calculator onClose={() => withViewTransition(() => setScreen(tab))} />}
        {screen === 'vault' && <VaultScreen onClose={() => withViewTransition(() => setScreen(tab))} />}
        {screen === 'fiscal' && <FiscalDeadlines onClose={() => withViewTransition(() => setScreen(tab))} />}
        {screen === 'settings' && (
          <Settings receipts={receipts} merchantCategoryMap={merchantCategoryMap} onRestore={handleRestore} onClose={() => withViewTransition(() => setScreen(tab))} />
        )}
        {screen === 'products' && <Products onClose={() => withViewTransition(() => setScreen(tab))} />}
        {screen === 'tickets' && <Tickets onClose={() => withViewTransition(() => setScreen(tab))} />}
        {screen === 'cards' && <LoyaltyCards onClose={() => withViewTransition(() => setScreen(tab))} />}

        {toast && <div className="toast">{toast}</div>}

        {updateAvailable && (
          <div className="update-banner">
            <span>{t('common.updateAvailable')}</span>
            <button onClick={() => window.location.reload()}>
              <Icon name="RotateCw" size={14} /> {t('common.updateReload')}
            </button>
          </div>
        )}

        {/* Niente più position:fixed qui (prima direttamente, poi anche via portale in
            document.body): su alcuni device/versioni di iOS in modalità standalone quella
            tecnica non si è dimostrata affidabile, con un gap sotto la barra di dimensione
            variabile che nessun aggiustamento ha risolto in modo definitivo. Come ultimo
            figlio del flex-column .app-viewport, la tab bar segue il flusso normale del
            layout: qualunque sia l'altezza reale di .app-viewport, lei è semplicemente
            "l'ultimo pezzo", incollata al fondo per costruzione, senza calcoli di viewport. */}
        {['home', 'search', 'calendar', 'dashboard', 'detail'].includes(screen) &&
          <TabBar active={tab} onNavigate={navigate} />}
      </div>
    </div>
  )
}
