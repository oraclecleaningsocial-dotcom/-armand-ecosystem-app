import { useState } from 'react';
import { Card, Icon, SectionTitle } from './ui.jsx';

const WEATHER_CONDITIONS = ['Sole', 'Nuvole', 'Pioggia', 'Temporale', 'Neve', 'Vento'];

export function Weather({ state, actions }) {
  const [w, setW] = useState(state.weather);
  return (
    <>
      <SectionTitle title="Meteo" subtitle="Widget con icona e suggerimenti giornata." />
      <Card>
        <div className="weatherHero">
          <Icon name={state.weather.icon} />
          <h2>{state.weather.temperature}°C</h2>
          <p>{state.weather.condition} · {state.weather.city}</p>
        </div>
      </Card>
      <Card>
        <div className="formGrid">
          <input value={w.city} onChange={e => setW({ ...w, city: e.target.value })} />
          <input type="number" value={w.temperature ?? ''} onChange={e => setW({ ...w, temperature: e.target.value })} />
          <select value={w.condition} onChange={e => setW({ ...w, condition: e.target.value })}>
            {WEATHER_CONDITIONS.map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input placeholder="Min" value={w.min ?? ''} onChange={e => setW({ ...w, min: e.target.value })} />
          <input placeholder="Max" value={w.max ?? ''} onChange={e => setW({ ...w, max: e.target.value })} />
          <input placeholder="Vento" value={w.wind ?? ''} onChange={e => setW({ ...w, wind: e.target.value })} />
          <button onClick={() => actions.updateWeather(w)}>Aggiorna meteo</button>
        </div>
      </Card>
    </>
  );
}
