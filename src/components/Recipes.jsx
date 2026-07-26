import { useState } from 'react';
import { Card, SectionTitle } from './ui.jsx';

export function Recipes({ state, actions }) {
  const [name, setName] = useState('');
  return (
    <>
      <SectionTitle title="Ricette" subtitle="Aggiungi, assegna ai pasti e genera automaticamente la spesa senza duplicati." />
      <Card>
        <h3>Nuova ricetta rapida</h3>
        <div className="row">
          <input placeholder="Nome ricetta" value={name} onChange={e => setName(e.target.value)} />
          <button
            onClick={() => {
              actions.addRecipe({
                name,
                mealType: 'altro',
                prepTime: 10,
                ingredients: [{ name: 'Ingrediente', quantity: 1, unit: 'pz', category: 'Altro', estimatedPrice: 0 }],
                steps: ['Preparazione breve']
              });
              setName('');
            }}
          >
            Aggiungi
          </button>
        </div>
      </Card>
      <div className="grid2">
        {state.recipes.map(r => (
          <Card key={r.id}>
            <h3>{r.name}</h3>
            <p>{r.mealType} · {r.prepTime} min</p>
            <ul>
              {r.ingredients.map(i => (
                <li key={i.name}>{i.quantity} {i.unit} {i.name} — {i.category}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
