import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

export function MedicationLike({ title, items, add, source }) {
  const [m, setM] = useState({ name: '', dosage: '', frequency: 'giornaliera', time: '09:00', reminderEnabled: true });
  return (
    <>
      <SectionTitle title={title} />
      <Card>
        <div className="formGrid">
          <input placeholder="Nome" value={m.name} onChange={e => setM({ ...m, name: e.target.value })} />
          <input placeholder="Dosaggio" value={m.dosage} onChange={e => setM({ ...m, dosage: e.target.value })} />
          <input value={m.frequency} onChange={e => setM({ ...m, frequency: e.target.value })} />
          <input type="time" value={m.time} onChange={e => setM({ ...m, time: e.target.value })} />
          <button
            onClick={() => {
              add(m);
              setM({ ...m, name: '', dosage: '' });
            }}
          >
            Aggiungi
          </button>
        </div>
      </Card>
      {items.map(x => (
        <Card key={x.id}>
          <h3>{x.name}</h3>
          <p>{x.dosage} · {x.frequency} · {x.time}</p>
          <small>Fonte input: {source}</small>
        </Card>
      ))}
    </>
  );
}
