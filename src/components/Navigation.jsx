import { Bell, Home, HeartPulse, NotebookText, ShoppingCart, Wallet } from 'lucide-react';
import { getQuickAddOptions, getTodayNotifications } from '../store/index.js';

export function TopBar({ state }) {
  return (
    <header className="top">
      <div>
        <p>{new Date(state.currentDate).toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        <h1>Ciao {state.user.name}</h1>
      </div>
      <div className="pill">
        <Bell size={16} />
        {getTodayNotifications().length} promemoria oggi
      </div>
    </header>
  );
}

const BOTTOM_NAV_ITEMS = [
  ['dashboard', 'Home', Home],
  ['shopping', 'Spesa', ShoppingCart],
  ['finance', 'Finanza', Wallet],
  ['health', 'Salute', HeartPulse],
  ['notes', 'Note', NotebookText]
];

export function BottomNav({ screen, setScreen }) {
  return (
    <div className="bottomNav">
      {BOTTOM_NAV_ITEMS.map(([id, l, I]) => (
        <button className={screen === id ? 'active' : ''} onClick={() => setScreen(id)} key={id}>
          <I size={20} />
          <span>{l}</span>
        </button>
      ))}
    </div>
  );
}

const QUICK_MENU_SCREEN_MAP = {
  'Aggiungi prodotto': 'shopping',
  'Aggiungi ricetta': 'recipes',
  'Aggiungi entrata': 'finance',
  'Aggiungi uscita': 'finance',
  'Aggiungi budget': 'finance',
  'Aggiungi obiettivo risparmio': 'finance',
  'Aggiungi allenamento': 'workouts',
  'Aggiungi esercizio': 'workouts',
  'Aggiungi pressione': 'pressure',
  'Aggiungi temperatura': 'temperature',
  'Aggiungi farmaco': 'medications',
  'Aggiungi integratore': 'supplements',
  'Aggiungi nota': 'notes',
  'Aggiungi promemoria': 'notifications'
};

export function QuickMenu({ screen, setScreen, close }) {
  return (
    <div className="quick">
      <h3>Aggiunta rapida</h3>
      {getQuickAddOptions(screen).map(o => (
        <button
          key={o}
          onClick={() => {
            setScreen(QUICK_MENU_SCREEN_MAP[o] || screen);
            close();
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
