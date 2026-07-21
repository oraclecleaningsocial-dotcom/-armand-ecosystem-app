import { STORAGE_KEY, starterState } from '../constants.js';
import { bootstrap } from './dashboard.js';

export let appState = structuredClone(starterState);

export function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function createShoppingKey(name, unit, category) {
  return `${String(name).toLowerCase().trim()}_${String(unit).toLowerCase().trim()}_${String(category).toLowerCase().trim()}`;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    return { success: true };
  } catch {
    return { success: false, errors: ['Impossibile salvare i dati'] };
  }
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) Object.assign(appState, JSON.parse(saved));
    bootstrap();
    return { success: true };
  } catch {
    bootstrap();
    return { success: false, errors: ['Impossibile caricare i dati salvati'] };
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  appState = structuredClone(starterState);
  bootstrap();
}
