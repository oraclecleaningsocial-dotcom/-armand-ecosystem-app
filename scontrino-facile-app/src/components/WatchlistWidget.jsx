import { useState } from 'react'
import Icon from './Icon'
import { addWatchlistItem, loadWatchlist, removeWatchlistItem } from '../utils/watchlist'

export default function WatchlistWidget() {
  const [items, setItems] = useState(loadWatchlist)
  const [ticker, setTicker] = useState('')
  const [price, setPrice] = useState('')

  function add(e) {
    e.preventDefault()
    if (!ticker.trim()) return
    setItems(addWatchlistItem(items, ticker.trim(), price.trim()))
    setTicker('')
    setPrice('')
  }

  function remove(id) {
    setItems(removeWatchlistItem(items, id))
  }

  return (
    <div className="widget-card">
      <p className="widget-title">Borsa — watchlist</p>
      <p className="widget-hint">Nessun listino azionario è disponibile gratis e senza chiave da un'app solo-client: qui puoi tenere un elenco di titoli con il prezzo che aggiorni tu.</p>

      {items.length > 0 && (
        <div className="watchlist-list">
          {items.map((it) => (
            <div className="watchlist-row" key={it.id}>
              <span className="watchlist-ticker">{it.ticker}</span>
              <span className="watchlist-price">{it.price || '—'}</span>
              <button onClick={() => remove(it.id)} aria-label="Rimuovi"><Icon name="X" size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <form className="watchlist-add" onSubmit={add}>
        <input placeholder="Ticker (es. ENI.MI)" value={ticker} onChange={(e) => setTicker(e.target.value)} />
        <input placeholder="Prezzo" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button type="submit" aria-label="Aggiungi"><Icon name="Plus" size={15} /></button>
      </form>
    </div>
  )
}
