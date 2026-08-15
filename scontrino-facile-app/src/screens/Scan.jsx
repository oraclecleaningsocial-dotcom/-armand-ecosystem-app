import { useRef, useState } from 'react'
import Icon from '../components/Icon'
import { CATEGORIES } from '../categories'
import { recognizeReceipt } from '../ocr'
import { eur, toLocalDateKey } from '../utils/format'
import { compressImage } from '../utils/compressImage'
import { useI18n } from '../i18n'

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Scan({ categorize, onSave, onCancel }) {
  const { t } = useI18n()
  const [step, setStep] = useState('camera') // camera | processing | review
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [draft, setDraft] = useState(null)
  const [showItems, setShowItems] = useState(false)
  const [notice, setNotice] = useState('')
  const [sourceType, setSourceType] = useState('foto')
  const inputRef = useRef(null)
  const galleryRef = useRef(null)

  async function handleFile(e, source) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSourceType(source)
    const rawDataUrl = await readAsDataUrl(file)
    setStep('processing')
    // Il motore OCR gira in un web worker: in rari casi (rete assente al primo avvio,
    // dati lingua non scaricabili) l'errore emerge come eccezione globale invece che
    // come rifiuto della promise. Questa guardia evita che lo spinner resti bloccato.
    let removeGuard = () => {}
    const globalErrorGuard = new Promise((_, reject) => {
      const onError = (event) => reject(event.error || new Error(event.message))
      window.addEventListener('error', onError, { once: true })
      removeGuard = () => window.removeEventListener('error', onError)
    })
    try {
      // OCR sull'originale ad alta risoluzione (la foto della fotocamera): comprimere
      // prima peggiorerebbe la lettura del testo piccolo.
      const parsed = await Promise.race([recognizeReceipt(rawDataUrl), globalErrorGuard])
      setDraft({ ...parsed, category: categorize(parsed.merchant, parsed.items?.map((it) => it.name)), note: '' })
    } catch {
      setNotice(source === 'screenshot' ? t('scan.errorScreenshot') : t('scan.errorReceipt'))
      setDraft({ merchant: '', date: toLocalDateKey(), total: 0, totalSource: 'manualOverride', items: [], address: '', phone: '', vat: '', ocrRawText: '', category: 'altro', note: '' })
    } finally {
      removeGuard()
    }
    // Quella che salviamo è solo per l'anteprima/miniatura, non serve la piena
    // risoluzione: una foto di fotocamera può pesare diversi MB, e salvarla così com'è
    // per ogni scontrino riempie in fretta la localStorage (vedi compressImage.js).
    const compactDataUrl = await compressImage(rawDataUrl).catch(() => rawDataUrl)
    setImageDataUrl(compactDataUrl)
    setStep('review')
  }

  function save() {
    onSave({ ...draft, imageDataUrl, sourceType })
  }

  function addManually() {
    setSourceType('manuale')
    setImageDataUrl(null)
    setDraft({ merchant: '', date: toLocalDateKey(), total: 0, totalSource: 'manualOverride', items: [], address: '', phone: '', vat: '', ocrRawText: '', category: 'altro', note: '' })
    setStep('review')
  }

  if (step === 'review' && draft) {
    return (
      <div className="screen">
        <div className="rev-top">
          <button className="link-btn" onClick={onCancel}><Icon name="X" size={16} /> {t('common.cancel')}</button>
          <button className="link-btn accent" onClick={save}>{t('common.save')} <Icon name="Check" size={15} /></button>
        </div>
        <div className="pad">
          {notice && <p className="notice">{notice}</p>}

          {sourceType !== 'manuale' && (
            <div className="thumb-strip">
              {imageDataUrl ? <img src={imageDataUrl} alt={sourceType === 'screenshot' ? t('scan.screenshotAlt') : t('scan.receiptAlt')} /> : <div className="thumb-strip-empty" />}
            </div>
          )}

          <label className="field">
            <span>{sourceType === 'screenshot' ? t('scan.beneficiary') : t('scan.merchant')}</span>
            <input value={draft.merchant} onChange={(e) => setDraft({ ...draft, merchant: e.target.value })} placeholder={sourceType === 'manuale' ? t('scan.merchantPlaceholder') : undefined} />
          </label>

          {sourceType === 'foto' && (
            <>
              <label className="field">
                <span><Icon name="MapPin" size={13} /> {t('scan.address')} <em>{t('scan.addressReadFromReceipt')}</em></span>
                <input value={draft.address || ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder={t('scan.addressPlaceholder')} />
              </label>
              <div className="field-row">
                <label className="field">
                  <span><Icon name="Phone" size={13} /> {t('scan.phone')}</span>
                  <input value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="—" />
                </label>
                <label className="field">
                  <span><Icon name="FileText" size={13} /> {t('scan.vat')}</span>
                  <input value={draft.vat || ''} onChange={(e) => setDraft({ ...draft, vat: e.target.value })} placeholder="—" />
                </label>
              </div>
            </>
          )}

          <label className="field">
            <span>{t('scan.date')}</span>
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </label>

          <label className="field">
            <span>{t('scan.total')}</span>
            <input type="number" step="0.01" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value, totalSource: 'manualOverride' })} />
            {draft.totalSource === 'ocrDetected' && <span className="ok-pill"><Icon name="Check" size={12} /> {t('scan.readFromReceipt')}</span>}
            {draft.totalSource === 'calculatedFromItems' && <span className="ok-pill warn">{t('scan.estimatedFromItems')}</span>}
          </label>

          <label className="field">
            <span>{t('scan.category')}{sourceType !== 'manuale' && <em> {t('scan.suggested')}</em>}</span>
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`category.${c.id}`)}</option>)}
            </select>
          </label>

          {draft.items.length > 0 && (
            <>
              <button className="disclosure" onClick={() => setShowItems((v) => !v)}>
                <Icon name={showItems ? 'ChevronDown' : 'ChevronRight'} size={14} /> {t('scan.seeItemsRead', { n: draft.items.length })}
              </button>
              {showItems && (
                <div className="items">
                  {draft.items.map((it, i) => (
                    <div className="item-row" key={i}>
                      <span>{it.qty > 1 && <b className="item-qty">{it.qty}× </b>}{it.name}</span>
                      <span className="num">{eur(it.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <label className="field">
            <span><Icon name="StickyNote" size={13} /> {t('scan.note')}</span>
            <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder={t('scan.notePlaceholder')} />
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="screen cam-screen">
      <div className="cam-top">
        <button className="cam-x" onClick={onCancel}><Icon name="X" size={18} /></button>
      </div>
      <div className="cam-view">
        <div className="doc-frame">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="doc-lines">
            <i /><i /><i style={{ width: '60%' }} /><i /><i style={{ width: '40%' }} />
          </div>
        </div>
      </div>
      <p className="cam-hint">{step === 'processing' ? t('scan.readingInProgress') : t('scan.frameReceipt')}</p>
      <div className="cam-bottom">
        <label className={`shutter ${step === 'processing' ? 'is-busy' : ''}`}>
          {step === 'processing' ? <Icon name="Loader2" size={22} className="spin" /> : <span className="shutter-dot" />}
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFile(e, 'foto')} disabled={step === 'processing'} hidden />
        </label>
        <label className="cam-gallery">
          <Icon name="Image" size={15} /> {t('scan.uploadScreenshot')}
          <input ref={galleryRef} type="file" accept="image/*" onChange={(e) => handleFile(e, 'screenshot')} disabled={step === 'processing'} hidden />
        </label>
        <button className="cam-gallery" onClick={addManually} disabled={step === 'processing'}>
          <Icon name="Pencil" size={15} /> {t('scan.addManually')}
        </button>
      </div>
    </div>
  )
}
