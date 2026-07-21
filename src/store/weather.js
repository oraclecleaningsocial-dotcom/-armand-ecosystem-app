import { appState } from './state.js';
import { syncEcosystem } from './dashboard.js';

export function getWeatherIcon(condition) {
  const v = String(condition || '').toLowerCase();
  if (v.includes('sole')) return 'sun';
  if (v.includes('pioggia')) return 'rain';
  if (v.includes('temporale')) return 'storm';
  if (v.includes('neve')) return 'snow';
  if (v.includes('vento')) return 'wind';
  if (v.includes('nuvol')) return 'cloud';
  return 'cloud';
}

export function updateWeather(weatherData) {
  appState.weather = {
    city: weatherData.city || 'Posizione attuale',
    temperature: weatherData.temperature ?? null,
    condition: weatherData.condition || 'Non disponibile',
    icon: getWeatherIcon(weatherData.condition),
    min: weatherData.min ?? null,
    max: weatherData.max ?? null,
    rainProbability: weatherData.rainProbability ?? null,
    wind: weatherData.wind ?? null,
    lastUpdated: new Date().toISOString()
  };
  syncEcosystem('WEATHER_UPDATED', {});
  return { success: true, weather: appState.weather };
}
