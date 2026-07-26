import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

export function Pressure({ state, actions }) {
  const [p, setP] = useState({ sys: 120, dia: 80, hr: 72, date: state.currentDate, time: '08:30', note: '' });
  return (
    <>
      <SectionTitle title="Pressione" />
      <Card>
        <div className="formGrid">
          <input type="number" value={p.sys} onChange={e => setP({ ...p, sys: e.target.value })} />
          <input type="number" value={p.dia} onChange={e => setP({ ...p, dia: e.target.value })} />
          <input type="number" value={p.hr} onChange={e => setP({ ...p, hr: e.target.value })} />
          <input type="date" value={p.date} onChange={e => setP({ ...p, date: e.target.value })} />
          <input type="time" value={p.time} onChange={e => setP({ ...p, time: e.target.value })} />
          <input placeholder="Nota" value={p.note} onChange={e => setP({ ...p, note: e.target.value })} />
          <button onClick={() => actions.addPressure(p.sys, p.dia, p.hr, p.date, p.time, p.note)}>Salva pressione</button>
        </div>
      </Card>
      {state.health.bloodPressure.slice().reverse().map(x => (
        <Card key={x.id}>
          <h3>{x.systolic}/{x.diastolic}</h3>
          <p>{x.heartRate || '-'} bpm · {x.date} {x.time}</p>
        </Card>
      ))}
    </>
  );
}
