import { appState } from './state.js';
import { syncEcosystem } from './dashboard.js';

export function requestHealthPermissions() {
  return { success: true, message: 'Richiedi autorizzazione utente per accedere ai dati Apple Health' };
}

export function connectAppleHealth() {
  appState.appleHealth = {
    connected: true,
    lastSync: null,
    permissions: { steps: true, activeCalories: true, heartRate: true, workouts: true, sleep: true, weight: true, height: true }
  };
  syncEcosystem('APPLE_HEALTH_CONNECTED', {});
  return { success: true, message: 'Apple Health collegato in modalità mock. In React Native collegare HealthKit.' };
}

export function disconnectAppleHealth() {
  appState.appleHealth = { connected: false, lastSync: null, permissions: {} };
  syncEcosystem('APPLE_HEALTH_DISCONNECTED', {});
  return { success: true };
}

export function syncHealthData() {
  if (!appState.appleHealth?.connected) return { success: false, errors: ['Apple Health non collegato'] };
  appState.appleHealth.lastSync = new Date().toISOString();
  appState.appleHealthSummary = { stepsToday: 0, activeCalories: 0, heartRateAverage: null, lastWorkout: null, sleepHours: null };
  syncEcosystem('APPLE_HEALTH_SYNCED', {});
  return { success: true, data: appState.appleHealthSummary };
}

export function getHealthSummaryFromAppleHealth() {
  return appState.appleHealthSummary || { stepsToday: 0, activeCalories: 0, heartRateAverage: null, lastWorkout: null, sleepHours: null };
}
