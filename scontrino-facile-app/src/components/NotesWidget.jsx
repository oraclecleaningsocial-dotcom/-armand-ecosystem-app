import { useEffect, useState } from 'react'
import Icon from './Icon'
import { useI18n } from '../i18n'
import { isSpeechToTextSupported, useSpeechToText } from '../utils/speechToText'

// Colori da bigliettino adesivo — ciclati per id invece che per posizione, così una nota
// non cambia colore ogni volta che se ne aggiunge un'altra prima nell'elenco.
const NOTE_COLORS = ['#f0d666', '#f3a9ba', '#9fd9c9', '#a7c8f2', '#d8b6f2', '#f2c08a']

function colorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return NOTE_COLORS[hash % NOTE_COLORS.length]
}

export default function NotesWidget({ notes = [], onAddNote, onDeleteNote }) {
  const { t, lang } = useI18n()
  const [text, setText] = useState('')
  const speech = useSpeechToText(lang)
  const dictationSupported = isSpeechToTextSupported()

  // Mentre si sta dettando, il campo mostra la trascrizione live (finale + parziale)
  // invece di quello che l'utente avrebbe digitato — appena si ferma il microfono si
  // torna a un normale input modificabile.
  useEffect(() => {
    if (speech.listening) setText(speech.transcript)
  }, [speech.transcript, speech.listening])

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAddNote?.(text.trim())
    setText('')
  }

  // "Parla e lui trascrive in una nota che salva": appena il microfono si ferma, se
  // c'è del testo trascritto viene salvato subito come nota, senza dover premere
  // anche il pulsante "+". Si legge speech.transcript (non lo stato text) per evitare
  // la corsa tra l'ultimo aggiornamento della trascrizione e questo stesso click.
  function toggleDictation() {
    if (speech.listening) {
      const finalText = speech.transcript.trim()
      speech.stop()
      if (finalText) onAddNote?.(finalText)
      setText('')
      speech.reset()
    } else {
      setText('')
      speech.reset()
      speech.start()
    }
  }

  return (
    <div className="widget-card">
      <p className="widget-title"><Icon name="StickyNote" size={14} /> {t('notesWidget.title')}</p>

      <form className="reminder-add" onSubmit={submit}>
        <input
          placeholder={speech.listening ? t('notesWidget.listening') : t('notesWidget.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          readOnly={speech.listening}
        />
        {dictationSupported && (
          <button
            type="button"
            className={`mic-btn ${speech.listening ? 'is-listening' : ''}`}
            onClick={toggleDictation}
            aria-label={speech.listening ? t('notesWidget.stopDictation') : t('notesWidget.startDictation')}
          >
            <Icon name={speech.listening ? 'MicOff' : 'Mic'} size={15} />
          </button>
        )}
        <button type="submit" aria-label={t('common.add')}><Icon name="Plus" size={15} /></button>
      </form>

      {!dictationSupported && (
        <p className="widget-hint" style={{ margin: '6px 0 0' }}>{t('notesWidget.dictationNotSupported')}</p>
      )}
      {speech.error && speech.error !== 'not-supported' && (
        <p className="notice" style={{ marginTop: 8 }}>{t('notesWidget.dictationError')}</p>
      )}

      {notes.length === 0 ? (
        <p className="empty" style={{ margin: '4px 0 0' }}>{t('notesWidget.empty')}</p>
      ) : (
        <div className="notes-grid">
          {notes.map((n) => (
            <div className="sticky-note" key={n.id} style={{ background: colorFor(n.id) }}>
              <button className="sticky-note-del" onClick={() => onDeleteNote?.(n.id)} aria-label={t('notesWidget.deleteNote')}>
                <Icon name="X" size={12} />
              </button>
              <p>{n.text}</p>
            </div>
          ))}
        </div>
      )}

      <p className="widget-hint">{t('notesWidget.hint')}</p>
    </div>
  )
}
