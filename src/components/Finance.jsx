import { useState } from 'react';
import { FINANCE_CATEGORIES } from '../constants.js';
import { changeFinanceMonth, ensureCurrentFinanceMonth, syncEcosystem } from '../store/index.js';
import { Card, euro, SectionTitle } from './ui.jsx';

export function Finance({ state, actions }) {
  const m = ensureCurrentFinanceMonth();
  const [entry, setEntry] = useState({ name: '', amount: '', category: 'Extra', kind: 'uscita', date: state.currentDate, reminder: false });
  return (
    <>
      <SectionTitle
        title="Finanza"
        subtitle={`Mese ${state.finance.selectedMonth} · Saldo ${euro(state.financeSummary?.availableBalance)} · Risparmio previsto ${euro(state.financeSummary?.expectedSavings)}`}
      />
      <Card>
        <h3>Nuovo movimento</h3>
        <div className="formGrid">
          <input
            type="month"
            value={state.finance.selectedMonth}
            onChange={e => {
              changeFinanceMonth(e.target.value);
              actions.refresh();
            }}
          />
          <select value={entry.kind} onChange={e => setEntry({ ...entry, kind: e.target.value })}>
            <option>uscita</option>
            <option>entrata</option>
          </select>
          <input placeholder="Nome" value={entry.name} onChange={e => setEntry({ ...entry, name: e.target.value })} />
          <input type="number" placeholder="Importo" value={entry.amount} onChange={e => setEntry({ ...entry, amount: e.target.value })} />
          <select value={entry.category} onChange={e => setEntry({ ...entry, category: e.target.value })}>
            {FINANCE_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} />
          <button
            onClick={() => {
              entry.kind === 'entrata'
                ? actions.addIncome(entry.name, entry.amount, 'variable', entry.date)
                : actions.addExpense(entry.name, entry.amount, entry.category, 'variable', entry.date);
              setEntry({ ...entry, name: '', amount: '' });
            }}
          >
            Salva
          </button>
        </div>
      </Card>
      <div className="grid3">
        <Card>
          <h3>Entrate</h3>
          <h2>{euro(state.financeSummary?.totalIncome)}</h2>
        </Card>
        <Card>
          <h3>Uscite</h3>
          <h2>{euro(state.financeSummary?.totalExpenses)}</h2>
        </Card>
        <Card>
          <h3>Obiettivo</h3>
          <input
            type="number"
            value={m.savingGoal}
            onChange={e => {
              m.savingGoal = Number(e.target.value);
              syncEcosystem('BUDGET_CHANGED');
              actions.refresh();
            }}
          />
        </Card>
      </div>
      <Card>
        <h3>Budget categoria</h3>
        <div className="formGrid">
          <select id="budgetCat">
            {FINANCE_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input id="budgetLimit" type="number" placeholder="Limite" />
          <button onClick={() => actions.addBudget(document.getElementById('budgetCat').value, document.getElementById('budgetLimit').value)}>
            Salva budget
          </button>
        </div>
        {m.budgets.map(b => (
          <p key={b.category}>{b.category}: {euro(b.used)} / {euro(b.limit)} — {b.percentageUsed}%</p>
        ))}
        {state.budgetAlerts.map(a => (
          <p className="alert" key={a.category}>{a.message}</p>
        ))}
      </Card>
      <div className="grid2">
        <Card>
          <h3>Entrate</h3>
          {m.incomes.map(i => (
            <p key={i.id}>{i.date} · {i.name} · {euro(i.amount)}</p>
          ))}
        </Card>
        <Card>
          <h3>Uscite</h3>
          {m.expenses.map(e => (
            <p key={e.id}>{e.date} · {e.name} · {euro(e.amount)} {e.automatic ? '· automatico' : ''}</p>
          ))}
        </Card>
      </div>
    </>
  );
}
