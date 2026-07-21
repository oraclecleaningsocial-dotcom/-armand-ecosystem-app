import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { SECTIONS } from './constants.js';
import {
  addBloodPressure, addBodyTemperature, addExerciseToWorkout, addIncome, addExpense,
  addManualShoppingItem, addMedication, addNote, addNotification, addOrUpdateBudget,
  addRecipe, addSupplement, addWorkout, appState, assignRecipeToMeal, completeWorkout,
  connectAppleHealth, deleteNote, deleteShoppingItem, disconnectAppleHealth, editExercise,
  loadState, markNotificationCompleted, pinNote, resetState, saveState,
  togglePurchasedItem, updateEstimatedPrice, updateRealPrice, updateWeather
} from './store/index.js';
import { BottomNav, QuickMenu, TopBar } from './components/Navigation.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Meals } from './components/Meals.jsx';
import { Recipes } from './components/Recipes.jsx';
import { Shopping } from './components/Shopping.jsx';
import { Finance } from './components/Finance.jsx';
import { Workouts } from './components/Workouts.jsx';
import { Exercises } from './components/Exercises.jsx';
import { Fitness } from './components/Fitness.jsx';
import { Health } from './components/Health.jsx';
import { Pressure } from './components/Pressure.jsx';
import { Temperature } from './components/Temperature.jsx';
import { Medications } from './components/Medications.jsx';
import { Supplements } from './components/Supplements.jsx';
import { Notes } from './components/Notes.jsx';
import { Weather } from './components/Weather.jsx';
import { Notifications } from './components/Notifications.jsx';
import { Suggestions } from './components/Suggestions.jsx';
import { SettingsPage } from './components/Settings.jsx';

const SCREEN_COMPONENTS = {
  dashboard: Dashboard,
  meals: Meals,
  recipes: Recipes,
  shopping: Shopping,
  finance: Finance,
  workouts: Workouts,
  exercises: Exercises,
  fitness: Fitness,
  health: Health,
  pressure: Pressure,
  temperature: Temperature,
  medications: Medications,
  supplements: Supplements,
  notes: Notes,
  weather: Weather,
  notifications: Notifications,
  suggestions: Suggestions,
  settings: SettingsPage
};

function Screen({ screen, state, actions }) {
  const C = SCREEN_COMPONENTS[screen] || Dashboard;
  return <C state={state} actions={actions} />;
}

export function App() {
  const [, force] = useState(0);
  const [screen, setScreenState] = useState('dashboard');
  const [quick, setQuick] = useState(false);
  const state = appState;
  const refresh = () => force(x => x + 1);
  const setScreen = s => {
    appState.currentScreen = s;
    setScreenState(s);
    saveState();
  };
  useEffect(() => {
    loadState();
    refresh();
  }, []);
  const actions = {
    refresh,
    setScreen,
    addManualShoppingItem: (...a) => { addManualShoppingItem(...a); refresh(); },
    togglePurchasedItem: id => { togglePurchasedItem(id); refresh(); },
    updateEstimatedPrice: (...a) => { updateEstimatedPrice(...a); refresh(); },
    updateRealPrice: (...a) => { updateRealPrice(...a); refresh(); },
    deleteShoppingItem: id => { deleteShoppingItem(id); refresh(); },
    addIncome: (...a) => { addIncome(...a); refresh(); },
    addExpense: (...a) => { addExpense(...a); refresh(); },
    addBudget: (...a) => { addOrUpdateBudget(...a); refresh(); },
    addWorkout: w => { addWorkout(w); refresh(); },
    addExercise: (...a) => { addExerciseToWorkout(...a); refresh(); },
    completeWorkout: id => { completeWorkout(id); refresh(); },
    editExercise: (...a) => { editExercise(...a); refresh(); },
    addPressure: (...a) => { addBloodPressure(...a); refresh(); },
    addTemp: (...a) => { addBodyTemperature(...a); refresh(); },
    addMedication: m => { addMedication(m); refresh(); },
    addSupplement: s => { addSupplement(s); refresh(); },
    addNote: n => { addNote(n); refresh(); },
    pinNote: id => { pinNote(id); refresh(); },
    deleteNote: id => { deleteNote(id); refresh(); },
    addNotification: n => { addNotification(n); refresh(); },
    completeNotification: id => { markNotificationCompleted(id); refresh(); },
    assignRecipe: (meal, id) => { assignRecipeToMeal(meal, id); refresh(); },
    addRecipe: r => { addRecipe(r); refresh(); },
    connectHealth: () => { connectAppleHealth(); refresh(); },
    disconnectHealth: () => { disconnectAppleHealth(); refresh(); },
    updateWeather: w => { updateWeather(w); refresh(); },
    reset: () => { resetState(); refresh(); }
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">A</div>
          <div>
            <b>Armand OS</b>
            <small>Ecosistema personale</small>
          </div>
        </div>
        <nav>
          {SECTIONS.map(([id, label, NavIcon]) => (
            <button key={id} onClick={() => setScreen(id)} className={screen === id ? 'active' : ''}>
              <NavIcon size={17} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <TopBar state={state} />
        <Screen screen={screen} state={state} actions={actions} />
      </main>
      <BottomNav screen={screen} setScreen={setScreen} />
      <button className="fab" onClick={() => setQuick(!quick)}>
        <Plus />
      </button>
      {quick && <QuickMenu screen={screen} setScreen={setScreen} close={() => setQuick(false)} />}
    </div>
  );
}
