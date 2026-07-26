import { useState } from 'react';
import { SHOPPING_CATEGORIES } from '../constants.js';
import { Card, euro, SectionTitle } from './ui.jsx';

export function Shopping({ state, actions }) {
  const [form, setForm] = useState({ name: '', quantity: 1, unit: 'pz', category: 'Altro', price: '' });
  const byCat = SHOPPING_CATEGORIES.map(c => [c, state.shoppingList.filter(i => i.category === c)]).filter(([, arr]) => arr.length);
  return (
    <>
      <SectionTitle
        title="Lista della spesa"
        subtitle={`Stimato ${euro(state.shoppingSummary?.estimatedTotal)} · Reale ${euro(state.shoppingSummary?.realTotal)}`}
      />
      <Card>
        <h3>Aggiungi prodotto manuale</h3>
        <div className="formGrid">
          <input placeholder="Prodotto" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {SHOPPING_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="number" placeholder="Prezzo stimato" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <button
            onClick={() => {
              actions.addManualShoppingItem(form.name, form.quantity, form.unit, form.category, form.price);
              setForm({ ...form, name: '', price: '' });
            }}
          >
            Aggiungi
          </button>
        </div>
      </Card>
      {byCat.map(([cat, items]) => (
        <Card key={cat}>
          <h3>{cat}</h3>
          {items.map(i => (
            <div className="item" key={i.id}>
              <input type="checkbox" checked={i.purchased} onChange={() => actions.togglePurchasedItem(i.id)} />
              <div>
                <b className={i.purchased ? 'done' : ''}>{i.name}</b>
                <small>{i.quantity} {i.unit}</small>
                <small>
                  Prezzo stimato <input type="number" value={i.estimatedPrice ?? ''} onChange={e => actions.updateEstimatedPrice(i.id, e.target.value)} />
                  {' '}Reale <input type="number" value={i.realPrice ?? ''} onChange={e => actions.updateRealPrice(i.id, e.target.value)} />
                </small>
              </div>
              <button className="ghost" onClick={() => actions.deleteShoppingItem(i.id)}>Elimina</button>
            </div>
          ))}
        </Card>
      ))}
    </>
  );
}
