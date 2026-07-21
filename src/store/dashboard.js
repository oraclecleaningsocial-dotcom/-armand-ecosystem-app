import { appState, saveState } from './state.js';
import { generateShoppingListFromDailyMeals, recalculateShoppingTotals, updateFoodExpenseFromShopping } from './shopping.js';
import { ensureCurrentFinanceMonth, calculateFinanceSummary, updateFinanceSummary, checkBudgetLimits, addOrUpdateBudget } from './finance.js';
import { calculateFitnessProgress } from './workouts.js';
import { calculateHealthSummary } from './health.js';
import { getLatestNotes } from './notes.js';
import { getTodayNotifications } from './notifications.js';

export function countPlannedMeals() {
  return ['breakfast', 'lunch', 'dinner', 'snack'].filter(k => appState.dailyMeals[k]).length;
}

export function generateSmartNotifications() {
  const smart = [];
  if (getTodayNotifications().length > 0) {
    smart.push({ type: 'today_notifications', message: `${appState.user.name}, hai ${getTodayNotifications().length} promemoria attivi oggi.`, action: 'Vedi notifiche' });
  }
  const w = appState.workouts.find(x => x.date === appState.currentDate && x.status === 'programmato');
  if (w) {
    smart.push({ type: 'today_workout', message: `${appState.user.name}, oggi hai l’allenamento: ${w.name}.`, action: 'Apri allenamenti' });
  }
  if (!appState.health.bloodPressure.at(-1)) {
    smart.push({ type: 'missing_pressure', message: 'Non hai ancora inserito una misurazione della pressione.', action: 'Aggiungi pressione' });
  }
  return smart;
}

export function generateSuggestions() {
  const suggestions = [];
  const missingPrices = appState.shoppingList.filter(i => i.estimatedPrice === null && i.realPrice === null);
  if (missingPrices.length) {
    suggestions.push({ type: 'missing_price', message: `Hai ${missingPrices.length} prodotti senza prezzo. Vuoi aggiungerli?`, action: 'Aggiungi prezzi' });
  }
  const notPurchased = appState.shoppingList.filter(i => !i.purchased);
  if (notPurchased.length) {
    suggestions.push({ type: 'shopping_remaining', message: `Ti mancano ${notPurchased.length} prodotti da comprare.`, action: 'Apri lista spesa' });
  }
  const fs = calculateFinanceSummary();
  if (fs.expectedSavings < 0) {
    suggestions.push({ type: 'negative_savings', message: 'Il risparmio previsto è negativo. Controlla le uscite.', action: 'Vedi finanza' });
  }
  if (fs.savingGoalDelta < 0) {
    suggestions.push({ type: 'saving_goal_not_reached', message: `Sei sotto l’obiettivo di risparmio di €${Math.abs(fs.savingGoalDelta).toFixed(2)}.`, action: 'Controlla budget' });
  }
  if (ensureCurrentFinanceMonth().budgets.length === 0) {
    suggestions.push({ type: 'missing_budget', message: 'Non hai ancora impostato un budget per questo mese.', action: 'Imposta budget' });
  }
  const todayWorkout = appState.workouts.find(w => w.date === appState.currentDate && w.status === 'programmato');
  if (todayWorkout) {
    suggestions.push({ type: 'today_workout', message: `${appState.user.name}, oggi hai l’allenamento: ${todayWorkout.name}.`, action: 'Apri allenamenti' });
  }
  if (!appState.health.bloodPressure.at(-1)) {
    suggestions.push({ type: 'missing_pressure', message: 'Non hai ancora inserito una misurazione della pressione.', action: 'Aggiungi pressione' });
  }
  if (appState.weather.condition?.toLowerCase().includes('pioggia')) {
    suggestions.push({ type: 'weather_indoor', message: 'Oggi potrebbe piovere. Valuta un allenamento indoor.', action: 'Apri allenamenti' });
  }
  appState.suggestions = suggestions;
  return suggestions;
}

export function generateDashboardWidgets() {
  const f = calculateFinanceSummary();
  const s = recalculateShoppingTotals();
  const fit = calculateFitnessProgress();
  const h = calculateHealthSummary();
  const latest = getLatestNotes(1)[0];
  const todayWorkout = appState.workouts.find(w => w.date === appState.currentDate && w.status === 'programmato');
  return [
    { id: 'welcome_armand', title: `Ciao ${appState.user.name}`, mainValue: 'Riepilogo di oggi', description: 'Pasti, allenamenti, salute, finanza e notifiche', dataSource: 'Dati personali, agenda, pasti, allenamenti e finanza', actionButton: 'Vedi giornata', screen: 'dashboard', icon: 'sparkles' },
    { id: 'daily_meals', title: 'Cosa mangio oggi', mainValue: countPlannedMeals() + ' pasti pianificati', description: 'Pasti impostati per oggi', dataSource: 'Piano alimentare giornaliero', actionButton: 'Vedi pasti', screen: 'meals', icon: 'salad' },
    { id: 'shopping_list', title: 'Lista della spesa', mainValue: s.notPurchasedItems + ' prodotti da comprare', description: s.totalItems + ' prodotti totali', dataSource: 'Ricette di oggi + prodotti manuali', actionButton: 'Apri lista', screen: 'shopping', icon: 'cart' },
    { id: 'finance_progress', title: 'Progressi finanza', mainValue: '€' + f.availableBalance.toFixed(2), description: 'Saldo disponibile e obiettivo risparmio', dataSource: 'Entrate, uscite, budget e obiettivo risparmio', actionButton: 'Vedi finanza', screen: 'finance', icon: 'wallet' },
    { id: 'budget_available', title: 'Budget disponibile', mainValue: '€' + f.availableBalance.toFixed(2), description: 'Saldo disponibile mensile', dataSource: 'Entrate e uscite del mese', actionButton: 'Modifica budget', screen: 'finance', icon: 'euro' },
    { id: 'expected_savings', title: 'Risparmio previsto', mainValue: '€' + f.expectedSavings.toFixed(2), description: 'Differenza obiettivo: €' + f.savingGoalDelta.toFixed(2), dataSource: 'Budget mensile + obiettivo risparmio', actionButton: 'Vedi finanza', screen: 'finance', icon: 'wallet' },
    { id: 'estimated_shopping', title: 'Spesa stimata', mainValue: '€' + s.estimatedTotal.toFixed(2), description: 'Costo stimato lista spesa', dataSource: 'Lista della spesa + prezzi stimati inseriti', actionButton: 'Modifica prezzi', screen: 'shopping', icon: 'cart' },
    { id: 'real_shopping', title: 'Spesa reale', mainValue: '€' + s.realTotal.toFixed(2), description: 'Costo reale prodotti acquistati', dataSource: 'Prezzi reali inseriti nella lista spesa', actionButton: 'Vedi spesa', screen: 'shopping', icon: 'receipt' },
    { id: 'workout_today', title: 'Allenamento', mainValue: todayWorkout?.name || 'Nessun allenamento oggi', description: `${fit.completedWorkouts} allenamenti completati`, dataSource: 'Lista allenamenti', actionButton: 'Apri allenamenti', screen: 'workouts', icon: 'dumbbell' },
    { id: 'health', title: 'Salute', mainValue: h.lastPressure ? `${h.lastPressure.systolic}/${h.lastPressure.diastolic}` : 'Nessuna pressione inserita', description: 'Pressione, temperatura, farmaci e integratori', dataSource: 'Misurazioni salute, farmaci e integratori', actionButton: 'Apri salute', screen: 'health', icon: 'heart' },
    { id: 'latest_notes', title: 'Ultime note', mainValue: getLatestNotes(3).length + ' note recenti', description: latest?.title || 'Nessuna nota recente', dataSource: 'Note personali', actionButton: 'Apri note', screen: 'notes', icon: 'note' },
    { id: 'weather', title: 'Meteo', mainValue: appState.weather.temperature !== null ? appState.weather.temperature + '°C' : 'Non disponibile', description: appState.weather.condition, dataSource: 'Servizio meteo / posizione utente', icon: appState.weather.icon, actionButton: 'Vedi meteo', screen: 'weather' },
    { id: 'notifications', title: 'Promemoria', mainValue: getTodayNotifications().length + ' oggi', description: 'Scadenze, farmaci, finanza e allenamenti', dataSource: 'Scadenze, farmaci, finanza, allenamenti', actionButton: 'Vedi promemoria', screen: 'notifications', icon: 'bell' },
    { id: 'smart_suggestions', title: 'Suggerimenti', mainValue: appState.suggestions.length + ' attivi', description: 'Azioni consigliate dal sistema', dataSource: 'Analisi automatica di pasti, spesa, finanza, allenamenti e salute', actionButton: 'Vedi suggerimenti', screen: 'suggestions', icon: 'sparkles' }
  ];
}

export function updateWidgets() {
  appState.widgets = generateDashboardWidgets();
  return appState.widgets;
}

export function getQuickAddOptions(currentScreen) {
  return ({
    dashboard: ['Aggiungi prodotto', 'Aggiungi ricetta', 'Aggiungi entrata', 'Aggiungi uscita', 'Aggiungi allenamento', 'Aggiungi pressione', 'Aggiungi temperatura', 'Aggiungi nota', 'Aggiungi promemoria'],
    shopping: ['Aggiungi prodotto', 'Importa ingredienti da ricetta', 'Crea categoria'],
    finance: ['Aggiungi entrata', 'Aggiungi uscita', 'Aggiungi budget', 'Aggiungi obiettivo risparmio', 'Aggiungi promemoria pagamento'],
    recipes: ['Aggiungi ricetta', 'Aggiungi pasto al giorno', 'Aggiungi ingrediente'],
    workouts: ['Aggiungi allenamento', 'Aggiungi esercizio', 'Aggiungi serie', 'Aggiungi nota allenamento', 'Duplica allenamento precedente'],
    health: ['Aggiungi pressione', 'Aggiungi temperatura', 'Aggiungi farmaco', 'Aggiungi integratore'],
    notes: ['Aggiungi nota', 'Fissa nota importante'],
    notifications: ['Aggiungi promemoria', 'Vedi promemoria di oggi']
  })[currentScreen] || ['Aggiungi prodotto', 'Aggiungi nota'];
}

export function syncEcosystem(eventType, payload = {}) {
  if (['RECIPE_ADDED', 'RECIPE_UPDATED', 'RECIPE_DELETED', 'RECIPE_ASSIGNED_TO_MEAL', 'MEAL_CHANGED'].includes(eventType)) {
    generateShoppingListFromDailyMeals();
  }
  if (['SHOPPING_ITEM_PURCHASED', 'REAL_PRICE_ADDED'].includes(eventType)) {
    updateFoodExpenseFromShopping();
  }
  recalculateShoppingTotals();
  updateFinanceSummary();
  checkBudgetLimits();
  calculateFitnessProgress();
  calculateHealthSummary();
  generateSuggestions();
  appState.suggestions = [...generateSuggestions(), ...generateSmartNotifications()].filter((v, i, a) => a.findIndex(x => x.type === v.type) === i);
  updateWidgets();
  saveState();
  return {
    widgets: appState.widgets,
    suggestions: appState.suggestions,
    shoppingSummary: appState.shoppingSummary,
    financeSummary: appState.financeSummary,
    fitnessSummary: appState.fitnessSummary,
    healthSummary: appState.healthSummary
  };
}

export function bootstrap() {
  ensureCurrentFinanceMonth();
  if (!appState.dailyMeals.breakfast) appState.dailyMeals.breakfast = { name: 'Yogurt con frutta', recipeId: 'recipe_demo_2' };
  if (!appState.dailyMeals.lunch) appState.dailyMeals.lunch = { name: 'Pasta integrale con tonno', recipeId: 'recipe_demo_1' };
  generateShoppingListFromDailyMeals();
  ensureCurrentFinanceMonth().savingGoal ||= 250;
  if (!ensureCurrentFinanceMonth().budgets.length) addOrUpdateBudget('Spesa alimentare', 250);
  recalculateShoppingTotals();
  updateFinanceSummary();
  checkBudgetLimits();
  calculateFitnessProgress();
  calculateHealthSummary();
  generateSuggestions();
  generateSmartNotifications();
  updateWidgets();
  saveState();
}
