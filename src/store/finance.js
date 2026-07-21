import { appState, createId } from './state.js';
import { syncEcosystem } from './dashboard.js';
import { scheduleReminder } from './notifications.js';

export function ensureCurrentFinanceMonth() {
  const m = appState.finance.selectedMonth;
  if (!appState.finance.months[m]) {
    appState.finance.months[m] = {
      startingBalance: 0, incomes: [], expenses: [], budgets: [], savingGoal: 0,
      totalIncome: 0, totalExpenses: 0, availableBalance: 0, expectedSavings: 0, savingGoalDelta: 0
    };
  }
  return appState.finance.months[m];
}

export function addIncome(name, amount, type = 'variable', date = appState.currentDate, reminder = null) {
  if (!name || !amount) return { success: false, errors: ['Inserisci entrata valida'] };
  const m = ensureCurrentFinanceMonth();
  const income = { id: createId('income'), name, amount: Number(amount), type, date, reminder };
  m.incomes.push(income);
  if (reminder?.enabled) {
    scheduleReminder('income', income.id, 'Promemoria entrata', `${appState.user.name}, entrata prevista: ${name} da €${amount}`, reminder.date || date, reminder.time || '09:00', 'Finanza');
  }
  syncEcosystem('INCOME_ADDED', income);
  return { success: true, income };
}

export function editIncome(incomeId, updatedData) {
  const i = ensureCurrentFinanceMonth().incomes.find(x => x.id === incomeId);
  if (!i) return { success: false };
  Object.assign(i, updatedData);
  syncEcosystem('INCOME_UPDATED', {});
  return { success: true, income: i };
}

export function deleteIncome(incomeId) {
  const m = ensureCurrentFinanceMonth();
  m.incomes = m.incomes.filter(i => i.id !== incomeId);
  syncEcosystem('INCOME_DELETED', {});
  return { success: true };
}

export function addExpense(name, amount, category = 'Extra', type = 'variable', date = appState.currentDate, reminder = null) {
  if (!name || !amount) return { success: false, errors: ['Inserisci uscita valida'] };
  const m = ensureCurrentFinanceMonth();
  const expense = { id: createId('expense'), name, amount: Number(amount), category, type, date, reminder, automatic: false };
  m.expenses.push(expense);
  if (reminder?.enabled) {
    scheduleReminder('expense', expense.id, 'Scadenza finanza', `${appState.user.name}, ricordati di pagare ${name} da €${amount}`, reminder.date || date, reminder.time || '09:00', 'Finanza');
  }
  syncEcosystem('EXPENSE_ADDED', expense);
  return { success: true, expense };
}

export function editExpense(expenseId, updatedData) {
  const e = ensureCurrentFinanceMonth().expenses.find(x => x.id === expenseId);
  if (!e) return { success: false };
  Object.assign(e, updatedData);
  syncEcosystem('EXPENSE_UPDATED', {});
  return { success: true, expense: e };
}

export function deleteExpense(expenseId) {
  const m = ensureCurrentFinanceMonth();
  m.expenses = m.expenses.filter(e => e.id !== expenseId);
  syncEcosystem('EXPENSE_DELETED', {});
  return { success: true };
}

export function addOrUpdateBudget(category, limit) {
  const m = ensureCurrentFinanceMonth();
  const b = m.budgets.find(x => x.category === category);
  if (b) {
    b.limit = Number(limit);
  } else {
    m.budgets.push({ category, limit: Number(limit), used: 0, remaining: Number(limit), percentageUsed: 0 });
  }
  syncEcosystem('BUDGET_CHANGED', {});
  return { success: true };
}

export function deleteBudget(category) {
  const m = ensureCurrentFinanceMonth();
  m.budgets = m.budgets.filter(b => b.category !== category);
  syncEcosystem('BUDGET_CHANGED', {});
  return { success: true };
}

export function calculateFinanceSummary() {
  const m = ensureCurrentFinanceMonth();
  const totalIncome = m.incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = m.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const availableBalance = Number(m.startingBalance || 0) + totalIncome - totalExpenses;
  const expectedSavings = availableBalance;
  const savingGoalDelta = availableBalance - Number(m.savingGoal || 0);
  return { totalIncome, totalExpenses, availableBalance, savingGoal: Number(m.savingGoal || 0), expectedSavings, savingGoalDelta };
}

export function updateFinanceSummary() {
  const m = ensureCurrentFinanceMonth();
  const s = calculateFinanceSummary();
  Object.assign(m, { totalIncome: s.totalIncome, totalExpenses: s.totalExpenses, availableBalance: s.availableBalance, expectedSavings: s.expectedSavings, savingGoalDelta: s.savingGoalDelta });
  appState.financeSummary = s;
  return s;
}

export function duplicatePreviousMonth(previousMonthKey, newMonthKey) {
  const prev = appState.finance.months[previousMonthKey];
  if (!prev) return { success: false, errors: ['Mese precedente non trovato'] };
  appState.finance.months[newMonthKey] = structuredClone(prev);
  const n = appState.finance.months[newMonthKey];
  n.expenses = n.expenses.filter(e => e.name !== 'Spesa alimentare da lista').map(e => ({ ...e, id: createId('expense'), date: `${newMonthKey}-01` }));
  n.incomes = n.incomes.map(i => ({ ...i, id: createId('income'), date: `${newMonthKey}-01` }));
  appState.finance.selectedMonth = newMonthKey;
  syncEcosystem('MONTH_CHANGED', {});
  return { success: true };
}

export function changeFinanceMonth(month) {
  appState.finance.selectedMonth = month;
  syncEcosystem('MONTH_CHANGED', {});
  return { success: true };
}

export function checkBudgetLimits() {
  const m = ensureCurrentFinanceMonth();
  const alerts = [];
  m.budgets.forEach(b => {
    const used = m.expenses.filter(e => e.category === b.category).reduce((s, e) => s + Number(e.amount || 0), 0);
    b.used = used;
    b.remaining = Number(b.limit || 0) - used;
    b.percentageUsed = b.limit > 0 ? Math.round((used / b.limit) * 100) : 0;
    if (used > b.limit) {
      alerts.push({ type: 'budget_exceeded', category: b.category, message: `Hai superato il budget per ${b.category}`, used, limit: b.limit });
    }
  });
  appState.budgetAlerts = alerts;
  return alerts;
}
