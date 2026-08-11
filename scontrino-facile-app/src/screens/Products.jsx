import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { addProduct, deleteProduct, getProducts, lookupBarcode, NOVA_LABELS, updateProduct } from '../utils/products'
import { eur } from '../utils/format'

const SCORE_COLORS = { A: '#2f9e5e', B: '#7fb52f', C: '#e0a72e', D: '#e07a2e', E: '#d94f4f' }

function ScoreBadge({ label, value }) {
  if (!value) return null
  const color = SCORE_COLORS[value] || 'var(--ink-soft)'
  return (
    <span className="score-badge" style={{ background: `${color}2e`, color }}>
      {label} {value}
    </span>
  )
}

// Scansione live del codice a barre tramite l'API BarcodeDetector: disponibile solo su
// alcuni browser (Chrome/Android soprattutto). Dove manca, l'utente inserisce il codice
// a mano — non trasciniamo dentro l'app una libreria di decoding pesante per un
// prototipo client-only che ha già Tesseract da caricare per l'OCR degli scontrini.
function useBarcodeScanner(onDetected) {
  const videoRef = useRef(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  async function start() {
    setError('')
    if (!supported) { setError('Il tuo browser non supporta la scansione live: inserisci il codice a mano.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          if (videoRef.current?.srcObject) requestAnimationFrame(tick)
          return
        }
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length) {
            onDetected(codes[0].rawValue)
            stop()
            return
          }
        } catch {
          // frame non decodificabile: si riprova al prossimo giro
        }
        if (videoRef.current?.srcObject) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } catch {
      setError('Impossibile accedere alla fotocamera. Inserisci il codice a mano.')
    }
  }

  function stop() {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }

  useEffect(() => () => stop(), [])

  return { videoRef, active, error, supported, start, stop }
}

export default function Products({ onClose }) {
  const [products, setProducts] = useState(getProducts)
  const [barcode, setBarcode] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [result, setResult] = useState(null)
  const [price, setPrice] = useState('')
  const [viewing, setViewing] = useState(null)

  const scanner = useBarcodeScanner((code) => setBarcode(code))

  async function handleSearch(e) {
    e.preventDefault()
    if (!barcode.trim()) return
    setSearching(true)
    setSearchError('')
    setResult(null)
    try {
      const found = await lookupBarcode(barcode.trim())
      if (!found) setSearchError('Prodotto non trovato su Open Food Facts. Puoi comunque salvarlo con il solo codice.')
      setResult(found || { barcode: barcode.trim(), name: '', brand: '' })
    } catch {
      // Copre sia errori di rete (offline, host irraggiungibile) sia risposte non
      // valide: il messaggio del browser (es. "Failed to fetch") non va mai mostrato
      // direttamente all'utente. Si può comunque salvare il prodotto a mano.
      setSearchError('Ricerca non riuscita. Controlla la connessione e riprova, oppure inserisci i dati a mano qui sotto.')
      setResult({ barcode: barcode.trim(), name: '', brand: '' })
    } finally {
      setSearching(false)
    }
  }

  function saveProduct() {
    if (!result) return
    const entry = addProduct({ ...result, price: price ? Number(price) : null })
    setProducts((prev) => [entry, ...prev])
    setResult(null)
    setBarcode('')
    setPrice('')
  }

  function handleDelete(id) {
    if (!window.confirm('Eliminare questo prodotto?')) return
    deleteProduct(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    if (viewing?.id === id) setViewing(null)
  }

  function savePriceEdit(id, value) {
    const updated = updateProduct(id, { price: value ? Number(value) : null })
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    setViewing(updated)
  }

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> Indietro</button>
      </div>

      <div className="pad">
        <h1 className="scr-title">Prodotti</h1>
        <p className="backup-hint">
          Scansiona o inserisci un codice a barre per vedere valori nutrizionali, Nutri-Score e livello di
          trasformazione (dati pubblici Open Food Facts), e tieni traccia del prezzo che trovi al supermercato.
        </p>

        <form onSubmit={handleSearch} className="product-search">
          <input
            className="edit-input"
            inputMode="numeric"
            placeholder="Codice a barre (es. 8001120344449)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
          />
          <div className="product-search-actions">
            <button type="submit" className="btn" disabled={searching || !barcode.trim()}>
              <Icon name={searching ? 'Loader2' : 'ScanSearch'} size={15} className={searching ? 'spin' : ''} /> {searching ? 'Cerco…' : 'Cerca prodotto'}
            </button>
            <button type="button" className="btn" onClick={scanner.active ? scanner.stop : scanner.start}>
              <Icon name="ScanBarcode" size={15} /> {scanner.active ? 'Ferma fotocamera' : 'Scansiona'}
            </button>
          </div>
          {scanner.error && <p className="notice">{scanner.error}</p>}
        </form>

        {scanner.active && (
          <div className="scan-video-wrap">
            <video ref={scanner.videoRef} playsInline muted className="scan-video" />
            <p className="scan-video-hint">Inquadra il codice a barre</p>
          </div>
        )}

        {searchError && <p className="notice">{searchError}</p>}

        {result && (
          <div className="product-preview">
            {result.imageUrl && <img src={result.imageUrl} alt={result.name} className="product-preview-img" />}
            <div className="product-preview-body">
              <input
                className="edit-input"
                placeholder="Nome prodotto"
                value={result.name}
                onChange={(e) => setResult({ ...result, name: e.target.value })}
              />
              {result.brand && <span className="product-preview-brand">{result.brand}</span>}
              <div className="score-row">
                <ScoreBadge label="Nutri-Score" value={result.nutriScore} />
                {result.novaGroup && <span className="score-badge nova">NOVA {result.novaGroup}</span>}
                <ScoreBadge label="Eco-Score" value={result.ecoScore} />
              </div>
              <label className="field" style={{ marginTop: 12 }}>
                <span>Prezzo al supermercato (facoltativo, inserito da te)</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <button className="btn currency-convert-btn" onClick={saveProduct} style={{ marginTop: 10 }}>
                <Icon name="Plus" size={15} /> Salva prodotto
              </button>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <p className="empty">Nessun prodotto salvato.</p>
        ) : (
          <div className="vault-doc-grid" style={{ marginTop: 22 }}>
            {products.map((p) => (
              <div className="vault-doc-card" key={p.id}>
                <button className="vault-doc-thumb" onClick={() => setViewing(p)} aria-label={`Apri ${p.name}`}>
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <span className="vault-doc-thumb-ic"><Icon name="Package" size={26} /></span>}
                </button>
                <button className="vault-doc-del" onClick={() => handleDelete(p.id)} aria-label="Elimina prodotto">
                  <Icon name="Trash2" size={14} />
                </button>
                <div className="vault-doc-card-text">
                  <b>{p.name || p.barcode}</b>
                  <span>{p.price != null ? eur(p.price) : 'Prezzo non inserito'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <div className="vault-viewer-overlay" onClick={() => setViewing(null)}>
          <div className="vault-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="vault-viewer-head">
              <span className="vault-viewer-title">{viewing.name || viewing.barcode}</span>
              <div className="vault-viewer-actions">
                <button onClick={() => setViewing(null)} aria-label="Chiudi"><Icon name="X" size={19} /></button>
              </div>
            </div>
            <div className="product-detail-body">
              {viewing.imageUrl && <img src={viewing.imageUrl} alt={viewing.name} className="product-detail-img" />}
              {viewing.brand && <p className="product-preview-brand">{viewing.brand}</p>}
              <div className="score-row">
                <ScoreBadge label="Nutri-Score" value={viewing.nutriScore} />
                {viewing.novaGroup && <span className="score-badge nova">NOVA {viewing.novaGroup}</span>}
                <ScoreBadge label="Eco-Score" value={viewing.ecoScore} />
              </div>
              {viewing.novaGroup && <p className="backup-hint">{NOVA_LABELS[viewing.novaGroup]}</p>}

              {(viewing.calories != null || viewing.carbs != null || viewing.proteins != null) && (
                <div className="items" style={{ marginTop: 14 }}>
                  <p className="sect-label" style={{ margin: '0 0 4px' }}>Valori per 100g</p>
                  {viewing.calories != null && <div className="item-row"><span>Energia</span><span className="num">{viewing.calories} kcal</span></div>}
                  {viewing.carbs != null && <div className="item-row"><span>Carboidrati</span><span className="num">{viewing.carbs} g</span></div>}
                  {viewing.sugars != null && <div className="item-row"><span>di cui zuccheri</span><span className="num">{viewing.sugars} g</span></div>}
                  {viewing.proteins != null && <div className="item-row"><span>Proteine</span><span className="num">{viewing.proteins} g</span></div>}
                  {viewing.fat != null && <div className="item-row"><span>Grassi</span><span className="num">{viewing.fat} g</span></div>}
                  {viewing.salt != null && <div className="item-row"><span>Sale</span><span className="num">{viewing.salt} g</span></div>}
                </div>
              )}

              <label className="field" style={{ marginTop: 14 }}>
                <span>Prezzo al supermercato</span>
                <input
                  type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00"
                  defaultValue={viewing.price ?? ''}
                  onBlur={(e) => savePriceEdit(viewing.id, e.target.value)}
                />
              </label>

              {viewing.ingredients && (
                <>
                  <p className="sect-label">Ingredienti</p>
                  <p className="backup-hint">{viewing.ingredients}</p>
                </>
              )}

              <p className="backup-hint" style={{ marginTop: 18 }}>
                Nutri-Score, NOVA ed Eco-Score arrivano dal database pubblico Open Food Facts. Il confronto prezzi in
                altri negozi e le recensioni della community non sono disponibili in un'app senza server: qui trovi
                solo il prezzo che inserisci tu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
