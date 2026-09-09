import { useMemo } from 'react'
import Icon from './Icon'
import { useBudget } from '../budget'
import { eur } from '../utils/format'
import { totalsByPeriod } from '../state'
import { useI18n } from '../i18n'

// Riepilogo compatto della schermata Entrate/Uscite, visibile direttamente in Report
// invece di dover aprire quella schermata solo per vedere il bilancio del mese — la
// gestione vera e propria (aggiungere/eliminare voci) resta lì, raggiungibile da qui con
// un tocco.
export default function BudgetWidget({ receipts, onNavigate }) {
  const { t } = useI18n()
  const { income, fixedExpenses } = useBudget()

  const now = new Date()
  const receiptsThisMonth = useMemo(
    () => totalsByPeriod(receipts, { year: now.getFullYear(), month: now.getMonth() }).total,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [receipts],
  )

  const totalIncome = income.reduce((s, e) => s + e.amount, 0)
  const totalFixed = fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const totalExpenses = totalFixed + receiptsThisMonth
  const balance = totalIncome - totalExpenses
  const hasData = income.length > 0 || fixedExpenses.length > 0

  return (
    <div className="widget-card">
      <p className="widget-title"><Icon name="TrendingUp" size={14} /> {t('budget.title')}</p>

      {hasData ? (
        <div className="budget-widget-body">
          <div className="budget-summary-row">
            <span className="budget-summary-label">
              <span className="budget-dot" style={{ background: 'var(--positive)' }} />
              {t('budget.totalIncome')}
            </span>
            <span className="budget-summary-amt" style={{ color: 'var(--positive)' }}>+{eur(totalIncome)}</span>
          </div>
          <div className="budget-summary-row">
            <span className="budget-summary-label">
              <span className="budget-dot" style={{ background: 'var(--negative)' }} />
              {t('budget.totalExpenses')}
            </span>
            <span className="budget-summary-amt" style={{ color: 'var(--negative)' }}>-{eur(totalExpenses)}</span>
          </div>
          <div className="budget-summary-balance">
            <span>{t('budget.balance')}</span>
            <b className={balance >= 0 ? 'is-positive' : 'is-negative'}>{eur(balance)}</b>
          </div>
        </div>
      ) : (
        <p className="empty" style={{ margin: 0 }}>{t('budget.widgetEmpty')}</p>
      )}

      <button className="widget-link" onClick={() => onNavigate?.('budget')}>
        {t('budget.manage')} <Icon name="ChevronRight" size={14} />
      </button>
    </div>
  )
}
