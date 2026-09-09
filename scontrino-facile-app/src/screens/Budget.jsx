import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { useBudget } from '../budget'
import { eur } from '../utils/format'
import { totalsByPeriod } from '../state'
import { useCountUp } from '../utils/useCountUp'
import { useI18n } from '../i18n'

function BudgetSection({ title, icon, iconColor, items, placeholder, onAdd, onDelete, emptyLabel }) {
  const { t } = useI18n()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!label.trim() || !amount) return
    onAdd(label.trim(), amount)
    setLabel('')
    setAmount('')
  }

  const total = items.reduce((s, it) => s + it.amount, 0)

  return (
    <div className="budget-section">
      <div className="budget-section-head">
        <p className="sect-label"><Icon name={icon} size={13} /> {title}</p>
        <span className="budget-section-total" style={{ color: iconColor }}>{eur(total)}</span>
      </div>

      <form className="budget-add-form" onSubmit={submit}>
        <input placeholder={placeholder} value={label} onChange={(e) => setLabel(e.target.value)} />
        <input
          className="budget-amount-input"
          type="number" step="0.01" inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" aria-label={t('common.add')} disabled={!label.trim() || !amount}>
          <Icon name="Plus" size={16} />
        </button>
      </form>

      {items.length === 0 ? (
        <p className="empty" style={{ margin: '4px 0 0' }}>{emptyLabel}</p>
      ) : (
        <div className="budget-rows">
          {items.map((it) => (
            <div className="budget-row" key={it.id}>
              <span className="budget-row-name">{it.label}</span>
              <span className="budget-row-amt">{eur(it.amount)}</span>
              <button className="budget-row-del" onClick={() => onDelete(it.id)} aria-label={t('common.delete')}>
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Budget({ receipts, onClose }) {
  const { t } = useI18n()
  const { income, fixedExpenses, addIncome, deleteIncome, addFixedExpense, deleteFixedExpense } = useBudget()

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
  const animatedBalance = useCountUp(balance)

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> {t('common.back')}</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">{t('budget.title')}</h1>
        <p className="backup-hint">{t('budget.description')}</p>

        <div className="budget-summary">
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
          <p className="budget-summary-hint">
            {t('budget.expensesBreakdown', { fixed: eur(totalFixed), receipts: eur(receiptsThisMonth) })}
          </p>
          <div className="budget-summary-balance">
            <span>{t('budget.balance')}</span>
            <b className={balance >= 0 ? 'is-positive' : 'is-negative'}>{eur(animatedBalance)}</b>
          </div>
        </div>

        <BudgetSection
          title={t('budget.income')}
          icon="TrendingUp"
          iconColor="var(--positive)"
          items={income}
          placeholder={t('budget.incomePlaceholder')}
          onAdd={addIncome}
          onDelete={deleteIncome}
          emptyLabel={t('budget.noIncome')}
        />

        <BudgetSection
          title={t('budget.fixedExpenses')}
          icon="Landmark"
          iconColor="var(--negative)"
          items={fixedExpenses}
          placeholder={t('budget.fixedExpensePlaceholder')}
          onAdd={addFixedExpense}
          onDelete={deleteFixedExpense}
          emptyLabel={t('budget.noFixedExpenses')}
        />
      </div>
    </div>
  )
}
