import { useRef, useState } from 'react'
import Icon from '../components/Icon'
import { addDocument, deleteDocument, getDocuments } from '../utils/vault'
import { formatDate } from '../utils/format'

const DOC_TYPES = [
  { id: 'cv', label: 'Curriculum', icon: 'Briefcase' },
  { id: 'payslip', label: 'Busta paga', icon: 'FileText' },
  { id: 'cud', label: 'CUD', icon: 'Landmark' },
  { id: 'altro', label: 'Altro', icon: 'FileText' },
]

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Vault({ onClose }) {
  const [documents, setDocuments] = useState(getDocuments)
  const [label, setLabel] = useState('')
  const [type, setType] = useState('cv')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const fileDataUrl = await readAsDataUrl(file)
      const doc = addDocument({
        label: label.trim() || DOC_TYPES.find((t) => t.id === type)?.label || 'Documento',
        type,
        fileName: file.name,
        fileMime: file.type,
        fileDataUrl,
      })
      setDocuments((prev) => [doc, ...prev])
      setLabel('')
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(id) {
    if (!window.confirm('Eliminare questo documento?')) return
    deleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  function openDoc(doc) {
    const w = window.open()
    if (!w) return
    if (doc.fileMime?.startsWith('image/')) {
      w.document.write(`<title>${doc.label}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${doc.fileDataUrl}" style="max-width:100%;max-height:100vh;"/></body>`)
    } else {
      w.document.write(`<title>${doc.label}</title><iframe src="${doc.fileDataUrl}" style="border:0;width:100%;height:100vh;"></iframe>`)
    }
  }

  return (
    <div className="screen">
      <div className="det-top">
        <button className="link-btn" onClick={onClose}><Icon name="ChevronLeft" size={17} /> Indietro</button>
        <span className="vault-header-lock"><Icon name="Lock" size={13} /> Protetto</span>
      </div>

      <div className="pad">
        <h1 className="scr-title">Documenti</h1>
        <p className="backup-hint">Curriculum, buste paga, CUD e altri documenti personali: protetti da codice, salvati solo su questo dispositivo.</p>

        <div className="vault-upload">
          <select className="edit-input" value={type} onChange={(e) => setType(e.target.value)}>
            {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input className="edit-input" placeholder="Nome (es. CV 2026)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <label className={`btn vault-upload-btn ${busy ? 'is-busy' : ''}`}>
            <Icon name={busy ? 'Loader2' : 'Upload'} size={15} className={busy ? 'spin' : ''} /> {busy ? 'Caricamento…' : 'Carica documento'}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={busy} hidden />
          </label>
        </div>

        {documents.length === 0 ? (
          <p className="empty">Nessun documento salvato.</p>
        ) : (
          <div className="vault-doc-list">
            {documents.map((doc) => {
              const meta = DOC_TYPES.find((t) => t.id === doc.type) || DOC_TYPES[3]
              return (
                <div className="vault-doc-row" key={doc.id}>
                  <button className="vault-doc-main" onClick={() => openDoc(doc)}>
                    <span className="vault-doc-ic"><Icon name={meta.icon} size={18} /></span>
                    <span className="vault-doc-text">
                      <b>{doc.label}</b>
                      <span>{meta.label} · {formatDate(doc.createdAt)}</span>
                    </span>
                  </button>
                  <button className="vault-doc-del" onClick={() => handleDelete(doc.id)} aria-label="Elimina documento">
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
