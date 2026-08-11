import { useEffect, useState } from 'react'
import Icon from './Icon'

const COINS = [
  { id: 'bitcoin', label: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', label: 'Solana', symbol: 'SOL' },
]

// Non esiste un'API azionaria (Borsa Italiana, NYSE, ecc.) gratuita e senza chiave
// utilizzabile da un'app solo-client: i dati di mercato in tempo reale sono a
// pagamento. Le quotazioni cripto invece sono pubbliche e senza chiave (CoinGecko),
// quindi sono il widget di mercato "live" più vicino a quello richiesto.
export default function CryptoWidget() {
  const [prices, setPrices] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const ids = COINS.map((c) => c.id).join(',')
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`)
        if (!res.ok) throw new Error('richiesta fallita')
        const data = await res.json()
        if (!cancelled) setPrices(data)
      } catch {
        if (!cancelled) setError('Quotazioni non disponibili. Controlla la connessione.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="widget-card">
      <p className="widget-title">Criptovalute</p>
      {loading && <p className="widget-hint">Aggiornamento quotazioni…</p>}
      {error && <p className="notice">{error}</p>}
      {prices && (
        <div className="crypto-list">
          {COINS.map((c) => {
            const entry = prices[c.id]
            if (!entry) return null
            const change = entry.eur_24h_change
            const up = change >= 0
            return (
              <div className="crypto-row" key={c.id}>
                <span className="crypto-name">{c.label} <em>{c.symbol}</em></span>
                <span className="crypto-price">€{entry.eur.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</span>
                {change != null && (
                  <span className={`crypto-change ${up ? 'up' : 'down'}`}>
                    <Icon name={up ? 'TrendingUp' : 'TrendingUp'} size={12} className={up ? '' : 'flip'} /> {Math.abs(change).toFixed(1)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <p className="widget-hint">Dati di mercato reali (CoinGecko). Non esiste un feed azionario gratuito utilizzabile qui: per la Borsa usa la watchlist qui sotto.</p>
    </div>
  )
}
