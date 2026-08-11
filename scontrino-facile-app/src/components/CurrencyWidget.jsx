import { useState } from 'react'
import Icon from './Icon'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD']

export default function CurrencyWidget() {
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
      const url = `https://api.frankfurter.app/latest?amount=${encodeURIComponent(nextAmount)}&from=${nextFrom}&to=${nextTo}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('richiesta fallita')
      const data = await res.json()
      setResult(data.rates[nextTo])
    } catch {
      setError('Cambio non disponibile. Controlla la connessione e riprova.')
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
      <p className="widget-title">Convertitore di valute</p>
      <div className="currency-row">
        <input
          className="currency-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select className="currency-select" value={from} onChange={(e) => { setFrom(e.target.value); convert(e.target.value, to, amount) }}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="currency-swap" onClick={swap} aria-label="Inverti valute">
          <Icon name="ArrowLeftRight" size={15} />
        </button>
        <select className="currency-select" value={to} onChange={(e) => { setTo(e.target.value); convert(from, e.target.value, amount) }}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button className="btn currency-convert-btn" onClick={() => convert()} disabled={loading}>
        {loading ? 'Converto…' : 'Converti'}
      </button>
      {result != null && (
        <p className="currency-result">{amount} {from} = <b>{result.toFixed(2)} {to}</b></p>
      )}
      {error && <p className="notice">{error}</p>}
      <p className="widget-hint">Cambi ufficiali BCE, aggiornati ogni giorno lavorativo.</p>
    </div>
  )
}
