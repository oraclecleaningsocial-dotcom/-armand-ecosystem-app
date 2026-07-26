import {
  Apple, Bell, Cloud, Dumbbell, Euro, HeartPulse, NotebookText, Pill,
  Plus, ReceiptText, Salad, ShoppingCart, Sparkles, Thermometer, Wallet
} from 'lucide-react';
import { countPlannedMeals, getLatestNotes, getTodayNotifications } from '../store/index.js';
import { euro, SectionTitle, Widget } from './ui.jsx';

export function Dashboard({ state, actions }) {
  const cards = [
    ['Cosa mangio oggi', countPlannedMeals() + ' pasti', 'meals', Salad],
    ['Lista della spesa', state.shoppingSummary?.notPurchasedItems + ' mancanti', 'shopping', ShoppingCart],
    ['Ricette del giorno', countPlannedMeals() + ' ricette', 'recipes', ReceiptText],
    ['Budget mensile', euro(state.financeSummary?.availableBalance), 'finance', Wallet],
    ['Entrate del mese', euro(state.financeSummary?.totalIncome), 'finance', Euro],
    ['Uscite del mese', euro(state.financeSummary?.totalExpenses), 'finance', Euro],
    ['Risparmio previsto', euro(state.financeSummary?.expectedSavings), 'finance', Wallet],
    ['Allenamento di oggi', state.workouts.find(w => w.date === state.currentDate)?.name || 'Nessuno', 'workouts', Dumbbell],
    ['Progressi fitness', (state.fitnessSummary?.completedWorkouts || 0) + ' completati', 'fitness', HeartPulse],
    ['Salute', state.healthSummary?.lastPressure ? `${state.healthSummary.lastPressure.systolic}/${state.healthSummary.lastPressure.diastolic}` : 'Da aggiornare', 'health', HeartPulse],
    ['Pressione', state.healthSummary?.lastPressure ? 'Ultima inserita' : 'Nessun dato', 'pressure', HeartPulse],
    ['Temperatura', state.healthSummary?.lastTemperature ? state.healthSummary.lastTemperature.value + '°C' : 'Nessun dato', 'temperature', Thermometer],
    ['Farmaci', state.health.medications.length + ' attivi', 'medications', Pill],
    ['Integratori', state.health.supplements.length + ' attivi', 'supplements', Apple],
    ['Ultime note', getLatestNotes(3).length + ' note', 'notes', NotebookText],
    ['Meteo', state.weather.temperature + '°C ' + state.weather.condition, 'weather', Cloud],
    ['Promemoria', getTodayNotifications().length + ' oggi', 'notifications', Bell],
    ['Suggerimenti intelligenti', state.suggestions.length + ' attivi', 'suggestions', Sparkles],
    ['Aggiunta rapida', '+', 'dashboard', Plus]
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
        {cards.map(([t, v, go, I]) => (
          <button className="opCard" key={t} onClick={() => actions.setScreen(go)}>
            <I size={21} />
            <h3>{t}</h3>
            <strong>{v}</strong>
          </button>
        ))}
      </div>
    </>
  );
}
