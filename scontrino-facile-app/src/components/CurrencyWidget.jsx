import { useState } from 'react'
import Icon from './Icon'
import { useI18n } from '../i18n'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'MUR', 'INR', 'CNY', 'ZAR', 'BRL', 'MXN', 'AED', 'SGD']

// open.er-api.com: servizio gratuito, senza chiave, con una copertura di valute molto più
// ampia di un servizio solo-BCE (include rupie mauriziane, indiane, ecc.). Un'unica chiamata
// restituisce tutti i cambi per la valuta di partenza, così anche "inverti" non richiede
// una seconda richiesta.
export default function CurrencyWidget() {
  const { t } = useI18n()
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('EUR')
  const [to, setTo] = useState('USD')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function convert(nextFrom = from, nextTo = to, nextAmount = amount) {
    if (!nextAmount || Number(nextAmount) <= 0) { setResult(null); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${nextFrom}`)
      if (!res.ok) throw new Error('richiesta fallita')
      const data = await res.json()
      const rate = data.rates?.[nextTo]
      if (!rate) throw new Error('valuta non disponibile')
      setResult(Number(nextAmount) * rate)
    } catch {
      setError(t('currencyWidget.error'))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  function swap() {
    const nextFrom = to
    const nextTo = from
    setFrom(nextFrom)
    setTo(nextTo)
    convert(nextFrom, nextTo, amount)
  }

  return (
    <div className="widget-card">
      <p className="widget-title">{t('currencyWidget.title')}</p>
      <div className="currency-row">
        <input
          className="currency-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setResult(null) }}
        />
        <select className="currency-select" value={from} onChange={(e) => { setFrom(e.target.value); convert(e.target.value, to, amount) }}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="currency-swap" onClick={swap} aria-label={t('currencyWidget.swap')}>
          <Icon name="ArrowLeftRight" size={15} />
        </button>
        <select className="currency-select" value={to} onChange={(e) => { setTo(e.target.value); convert(from, e.target.value, amount) }}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button className="btn currency-convert-btn" onClick={() => convert()} disabled={loading}>
        {loading ? t('currencyWidget.converting') : t('currencyWidget.convert')}
      </button>
      {result != null && (
        <p className="currency-result">{amount} {from} = <b>{result.toFixed(2)} {to}</b></p>
      )}
      {error && <p className="notice">{error}</p>}
      <p className="widget-hint">{t('currencyWidget.hint')}</p>
    </div>
  )
}
