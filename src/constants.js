import {
  Apple, Bell, Cloud, Dumbbell, HeartPulse, Home, ListChecks, NotebookText,
  Pill, ReceiptText, Salad, Settings, ShoppingCart, Sparkles, Thermometer, Wallet
} from 'lucide-react';

export const STORAGE_KEY = 'armand_ecosystem_app_state';

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthISO = () => new Date().toISOString().slice(0, 7);

export const FINANCE_CATEGORIES = [
  'Affitto / mutuo', 'Bollette', 'Spesa alimentare', 'Trasporti', 'Abbonamenti',
  'Svago', 'Salute', 'Fitness', 'Extra', 'Risparmio', 'Emergenze'
];

export const SHOPPING_CATEGORIES = [
  'Frutta', 'Verdura', 'Carne', 'Pesce', 'Latticini', 'Pasta / riso / cereali',
  'Dispensa', 'Surgelati', 'Bevande', 'Casa', 'Altro'
];

export const SECTIONS = [
  ['dashboard', 'Dashboard', Home],
  ['meals', 'Pasti di oggi', Salad],
  ['recipes', 'Ricette', ReceiptText],
  ['shopping', 'Lista spesa', ShoppingCart],
  ['finance', 'Finanza', Wallet],
  ['workouts', 'Allenamenti', Dumbbell],
  ['exercises', 'Esercizi', ListChecks],
  ['fitness', 'Fitness', HeartPulse],
  ['health', 'Salute', HeartPulse],
  ['pressure', 'Pressione', HeartPulse],
  ['temperature', 'Temperatura', Thermometer],
  ['medications', 'Farmaci', Pill],
  ['supplements', 'Integratori', Apple],
  ['notes', 'Note', NotebookText],
  ['weather', 'Meteo', Cloud],
  ['notifications', 'Promemoria', Bell],
  ['suggestions', 'Suggerimenti', Sparkles],
  ['settings', 'Impostazioni', Settings]
];

export const starterState = {
  user: { name: 'Armand' },
  currentDate: todayISO(),
  currentScreen: 'dashboard',
  dailyMeals: { date: todayISO(), breakfast: null, lunch: null, dinner: null, snack: null },
  recipes: [
    {
      id: 'recipe_demo_1',
      name: 'Pasta integrale con tonno',
      mealType: 'pranzo',
      prepTime: 18,
      ingredients: [
        { name: 'Pasta integrale', quantity: 100, unit: 'g', category: 'Pasta / riso / cereali', estimatedPrice: 0.7 },
        { name: 'Tonno', quantity: 1, unit: 'lattina', category: 'Pesce', estimatedPrice: 1.8 },
        { name: 'Pomodori', quantity: 2, unit: 'pz', category: 'Verdura', estimatedPrice: 1.2 }
      ],
      steps: ['Cuoci la pasta', 'Aggiungi tonno e pomodori', 'Condisci e servi']
    },
    {
      id: 'recipe_demo_2',
      name: 'Yogurt con frutta',
      mealType: 'colazione',
      prepTime: 5,
      ingredients: [
        { name: 'Yogurt greco', quantity: 1, unit: 'vasetto', category: 'Latticini', estimatedPrice: 1.1 },
        { name: 'Banana', quantity: 1, unit: 'pz', category: 'Frutta', estimatedPrice: 0.4 }
      ],
      steps: ['Taglia la frutta', 'Aggiungi yogurt', 'Mescola']
    }
  ],
  shoppingList: [],
  finance: { selectedMonth: monthISO(), months: {} },
  workouts: [
    {
      id: 'workout_demo_1',
      name: 'Total body leggero',
      date: todayISO(),
      time: '18:00',
      duration: 45,
      muscleGroup: 'Generale',
      notes: 'Sessione controllata',
      status: 'programmato',
      reminderEnabled: true,
      exercises: [
        { id: 'exercise_demo_1', name: 'Squat', sets: 3, reps: 12, weight: 0, restSeconds: 60, notes: 'Corpo libero', completed: false },
        { id: 'exercise_demo_2', name: 'Panca piana', sets: 4, reps: 10, weight: 70, restSeconds: 90, notes: 'Buona esecuzione', completed: false }
      ]
    }
  ],
  health: { bloodPressure: [], bodyTemperature: [], medications: [], supplements: [] },
  notes: [
    { id: 'note_demo_1', title: 'Obiettivo settimana', text: 'Controllare spesa, pressione e allenamento.', category: 'Generale', date: todayISO(), time: '09:00', pinned: true }
  ],
  weather: { city: 'Posizione attuale', temperature: 22, condition: 'Sole', icon: 'sun', min: 17, max: 25, rainProbability: 10, wind: '8 km/h', lastUpdated: new Date().toISOString() },
  notifications: [],
  widgets: [],
  suggestions: [],
  shoppingSummary: null,
  financeSummary: null,
  fitnessSummary: null,
  healthSummary: null,
  budgetAlerts: [],
  appleHealth: { connected: false, lastSync: null, permissions: {} }
};
