import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

const NOTIFICATION_CATEGORIES = ['Finanza', 'Salute', 'Fitness', 'Spesa', 'Note', 'Generale'];

export function Notifications({ state, actions }) {
  const [n, setN] = useState({ title: '', message: '', category: 'Generale', date: state.currentDate, time: '09:00' });
  return (
    <>
      <SectionTitle title="Notifiche e promemoria" />
      <Card>
        <h3>Calendario</h3>
        <p>Esporta questi promemoria (più allenamenti, farmaci e integratori) come file .ics per il Calendario del telefono.</p>
        <button onClick={actions.exportCalendar}>Esporta calendario (.ics)</button>
      </Card>
      <Card>
        <div className="formGrid">
          <input placeholder="Titolo" value={n.title} onChange={e => setN({ ...n, title: e.target.value })} />
          <input placeholder="Messaggio" value={n.message} onChange={e => setN({ ...n, message: e.target.value })} />
          <input type="date" value={n.date} onChange={e => setN({ ...n, date: e.target.value })} />
          <input type="time" value={n.time} onChange={e => setN({ ...n, time: e.target.value })} />
          <select value={n.category} onChange={e => setN({ ...n, category: e.target.value })}>
            {NOTIFICATION_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => {
              actions.addNotification(n);
              setN({ ...n, title: '', message: '' });
            }}
          >
            Aggiungi
          </button>
        </div>
      </Card>
      {state.notifications.map(x => (
        <Card key={x.id}>
          <h3>{x.title}</h3>
          <p>{x.message}</p>
          <small>{x.category} · {x.date} {x.time} · Stato: {x.status}</small>
          <button onClick={() => actions.completeNotification(x.id)}>Completa</button>
        </Card>
      ))}
    </>
  );
}
