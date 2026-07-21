import {
  Apple, Bell, Cloud, Dumbbell, Euro, HeartPulse, NotebookText, Pill,
  Plus, ReceiptText, Salad, ShoppingCart, Sparkles, Thermometer, Wallet
} from 'lucide-react';
import { countPlannedMeals, getLatestNotes, getTodayNotifications } from '../store/index.js';
import { euro, SectionTitle, Widget } from './ui.jsx';

export function Dashboard({ state, actions }) {
  const cards = [
    ['Cosa mangio oggi', countPlannedMeals() + ' pasti', 'Piano alimentare giornaliero', 'meals', Salad],
    ['Lista della spesa', state.shoppingSummary?.notPurchasedItems + ' mancanti', 'Ricette di oggi + manuali', 'shopping', ShoppingCart],
    ['Ricette del giorno', countPlannedMeals() + ' ricette', 'Pasti assegnati', 'recipes', ReceiptText],
    ['Budget mensile', euro(state.financeSummary?.availableBalance), 'Entrate e uscite mese', 'finance', Wallet],
    ['Entrate del mese', euro(state.financeSummary?.totalIncome), 'Finanza mese corrente', 'finance', Euro],
    ['Uscite del mese', euro(state.financeSummary?.totalExpenses), 'Finanza mese corrente', 'finance', Euro],
    ['Risparmio previsto', euro(state.financeSummary?.expectedSavings), 'Budget + obiettivo', 'finance', Wallet],
    ['Allenamento di oggi', state.workouts.find(w => w.date === state.currentDate)?.name || 'Nessuno', 'Lista allenamenti', 'workouts', Dumbbell],
    ['Progressi fitness', (state.fitnessSummary?.completedWorkouts || 0) + ' completati', 'Allenamenti completati', 'fitness', HeartPulse],
    ['Salute', state.healthSummary?.lastPressure ? `${state.healthSummary.lastPressure.systolic}/${state.healthSummary.lastPressure.diastolic}` : 'Da aggiornare', 'Misurazioni salute', 'health', HeartPulse],
    ['Pressione', state.healthSummary?.lastPressure ? 'Ultima inserita' : 'Nessun dato', 'Storico pressione', 'pressure', HeartPulse],
    ['Temperatura', state.healthSummary?.lastTemperature ? state.healthSummary.lastTemperature.value + '°C' : 'Nessun dato', 'Storico temperatura', 'temperature', Thermometer],
    ['Farmaci', state.health.medications.length + ' attivi', 'Farmaci inseriti', 'medications', Pill],
    ['Integratori', state.health.supplements.length + ' attivi', 'Integratori inseriti', 'supplements', Apple],
    ['Ultime note', getLatestNotes(3).length + ' note', 'Note personali', 'notes', NotebookText],
    ['Meteo', state.weather.temperature + '°C ' + state.weather.condition, 'Servizio meteo / posizione', 'weather', Cloud],
    ['Promemoria', getTodayNotifications().length + ' oggi', 'Notifiche attive', 'notifications', Bell],
    ['Suggerimenti intelligenti', state.suggestions.length + ' attivi', 'Analisi automatica dati', 'suggestions', Sparkles],
    ['Aggiunta rapida', '+', 'Menu contestuale', 'dashboard', Plus]
  ];
  return (
    <>
      <SectionTitle title="Dashboard" subtitle="Armand, cosa devi fare, mangiare, controllare e ricordare oggi?" />
      <div className="widgetGrid">
        {state.widgets.map(w => (
          <Widget key={w.id} w={w} onGo={actions.setScreen} />
        ))}
      </div>
      <SectionTitle title="Card operative" />
      <div className="cardGrid">
        {cards.map(([t, v, src, go, I]) => (
          <button className="opCard" key={t} onClick={() => actions.setScreen(go)}>
            <I size={21} />
            <h3>{t}</h3>
            <strong>{v}</strong>
            <p>Stato: aggiornato</p>
            <small>{src}</small>
            <span>Apri sezione</span>
          </button>
        ))}
      </div>
    </>
  );
}
