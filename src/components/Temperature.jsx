import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

export function Temperature({ state, actions }) {
  const [t, setT] = useState({ value: 36.7, date: state.currentDate, time: '08:45', note: '' });
  return (
    <>
      <SectionTitle title="Temperatura corporea" />
      <Card>
        <div className="formGrid">
          <input type="number" step="0.1" value={t.value} onChange={e => setT({ ...t, value: e.target.value })} />
          <input type="date" value={t.date} onChange={e => setT({ ...t, date: e.target.value })} />
          <input type="time" value={t.time} onChange={e => setT({ ...t, time: e.target.value })} />
          <input placeholder="Nota" value={t.note} onChange={e => setT({ ...t, note: e.target.value })} />
          <button onClick={() => actions.addTemp(t.value, t.date, t.time, t.note)}>Salva temperatura</button>
        </div>
      </Card>
      {state.health.bodyTemperature.slice().reverse().map(x => (
        <Card key={x.id}>
          <h3>{x.value} °C</h3>
          <p>{x.date} {x.time} · {x.note}</p>
        </Card>
      ))}
    </>
  );
}
