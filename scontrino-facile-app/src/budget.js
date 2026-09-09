import { useCallback } from 'react'
import { useIdbState } from './utils/idb'

const IDB_KEY = 'budget'
// Entrate e spese fisse sono sempre importi "al mese" per semplicità: niente scelta di
// ricorrenza (settimanale/annuale/una tantum) da configurare voce per voce — lo stesso
// compromesso "onesto e semplice" già scelto altrove nell'app (vedi state.js), pensato
// per la domanda concreta dell'utente ("quanto entra e quanto esce ogni mese"), non per
// diventare un vero motore di contabilità.
const EMPTY_BUDGET = { income: [], fixedExpenses: [] }

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export function useBudget() {
  const [budget, update] = useIdbState(IDB_KEY, EMPTY_BUDGET)

  const addIncome = useCallback((label, amount) => {
    const entry = { id: createId('inc'), label, amount: Number(amount) || 0, createdAt: new Date().toISOString() }
    update((prev) => ({ ...prev, income: [entry, ...prev.income] }))
  }, [update])

  const deleteIncome = useCallback((id) => {
    update((prev) => ({ ...prev, income: prev.income.filter((e) => e.id !== id) }))
  }, [update])

  const addFixedExpense = useCallback((label, amount) => {
    const entry = { id: createId('exp'), label, amount: Number(amount) || 0, createdAt: new Date().toISOString() }
    update((prev) => ({ ...prev, fixedExpenses: [entry, ...prev.fixedExpenses] }))
  }, [update])

  const deleteFixedExpense = useCallback((id) => {
    update((prev) => ({ ...prev, fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id) }))
  }, [update])

  return {
    income: budget.income,
    fixedExpenses: budget.fixedExpenses,
    addIncome,
    deleteIncome,
    addFixedExpense,
    deleteFixedExpense,
  }
}
