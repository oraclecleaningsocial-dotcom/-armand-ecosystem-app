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
import SuccessBurst from './components/SuccessBurst'

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

// Schermate raggiungibili da un link diretto (?screen=...): usato dalle "shortcuts" del
// manifest (long-press sull'icona, o l'app trovata dentro Shortcuts di Apple) per aprire
// l'app già sulla schermata giusta invece che sempre su Home. "detail" resta escluso
// perché richiede anche un ID di ricevuta che un link semplice non può fornire.
const DEEP_LINKABLE_SCREENS = ['home', 'search', 'calendar', 'dashboard', 'scan', 'calculator', 'vault', 'fiscal', 'settings', 'products', 'tickets', 'cards']

function screenFromUrl() {
  const requested = new URLSearchParams(window.location.search).get('screen')
  return DEEP_LINKABLE_SCREENS.includes(requested) ? requested : 'home'
}

export default function App() {
  const { t } = useI18n()
  const updateAvailable = useUpdateChecker()
  const [locked, setLocked] = useState(isLockEnabled)
  const { receipts, merchantCategoryMap, addReceipt, updateReceipt, deleteReceipt, categorize, replaceAll } = useReceipts()
  const { reminders, addReminder, deleteReminder } = useReminders()
  const { notes, addNote, deleteNote } = useNotes()
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos()
  const initialScreen = screenFromUrl()
  const [tab, setTab] = useState(['home', 'search', 'calendar', 'dashboard'].includes(initialScreen) ? initialScreen : 'home')
  const [screen, setScreen] = useState(initialScreen)
  const [detailId, setDetailId] = useState(null)
  const [detailBack, setDetailBack] = useState('home')
  const [toast, setToast] = useState('')
  const [searchPreset, setSearchPreset] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

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
    showToast(t('toast.receiptSaved'))
    setShowSuccess(true)
    navigate('home')
  }

  function handleDelete(id) {
    deleteReceipt(id)
    showToast(t('toast.receiptDeleted'))
    withViewTransition(() => setScreen(detailBack))
  }

  function showToast(msg, duration = 2200) {
    setToast(msg)
    setTimeout(() => setToast(''), duration)
  }

  // Ripulisce ?screen=... dall'URL dopo averlo letto una volta sola: altrimenti
  // resterebbe lì (visibile e condivisibile per errore) e riporterebbe l'utente alla
  // stessa schermata a ogni successivo refresh, invece di funzionare come un link
  // "usa e getta" pensato solo per l'apertura da una shortcut.
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  // Un salvataggio fallito per spazio esaurito (localStorage pieno) veniva prima ignorato
  // in silenzio da ogni modulo di stato — l'utente lo scopriva solo alla riapertura
  // dell'app, con dati mancanti. Con questo almeno lo sa subito.
  useEffect(() => {
    return onStorageError(() => showToast(t('toast.storageFull'), 4500))
  }, [t])

  function handleRestore(newReceipts, newMap) {
    replaceAll(newReceipts, newMap)
    showToast(t('toast.backupRestored'))
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
        <SuccessBurst show={showSuccess} onDone={() => setShowSuccess(false)} />

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
        {['home', 'search', 'calendar', 'dashboard', 'detail'].includes(screen) && (
          <>
            <TabBar active={tab} onNavigate={navigate} />
            {/* Ripiego manuale per i rari casi in cui la barra "risale" comunque, prima
                che uno degli eventi ascoltati in utils/viewportHeight.js abbia occasione
                di ricalcolare da solo: un riavvio completo dell'app azzera qualunque stato
                di layout rimasto sbagliato, invece di limitarsi a ricalcolare una singola
                variabile CSS. Fissato rispetto al vero viewport (non a .app-shell/
                .app-viewport, che sono proprio ciò che potrebbe avere l'altezza sbagliata
                in quel momento), così resta raggiungibile comunque. */}
            <button
              className="fix-gap-btn"
              onClick={() => window.location.reload()}
              aria-label={t('common.fixLayout')}
            >
              <Icon name="RotateCw" size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
