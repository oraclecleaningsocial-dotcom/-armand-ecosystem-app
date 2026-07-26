import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

const NOTE_CATEGORIES = ['Generale', 'Salute', 'Allenamento', 'Finanza', 'Alimentazione', 'Promemoria'];

export function Notes({ state, actions }) {
  const [n, setN] = useState({ title: '', text: '', category: 'Generale', pinned: false });
  return (
    <>
      <SectionTitle title="Note personali" />
      <Card>
        <div className="formGrid">
          <input placeholder="Titolo" value={n.title} onChange={e => setN({ ...n, title: e.target.value })} />
          <select value={n.category} onChange={e => setN({ ...n, category: e.target.value })}>
            {NOTE_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <textarea placeholder="Testo" value={n.text} onChange={e => setN({ ...n, text: e.target.value })} />
          <button
            onClick={() => {
              actions.addNote(n);
              setN({ ...n, title: '', text: '' });
            }}
          >
            Aggiungi nota
          </button>
        </div>
      </Card>
      {state.notes.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned)).map(note => (
        <Card key={note.id}>
          <h3>{note.pinned ? '📌 ' : ''}{note.title}</h3>
          <p>{note.text}</p>
          <small>{note.category}</small>
          <div className="row">
            <button onClick={() => actions.pinNote(note.id)}>Fissa</button>
            <button className="ghost" onClick={() => actions.deleteNote(note.id)}>Elimina</button>
          </div>
        </Card>
      ))}
    </>
  );
}
