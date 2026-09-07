import { useEffect, useRef, useState } from 'react'

// Web Speech API: gratuita, senza chiave, gira interamente nel browser (con invio audio
// al servizio di riconoscimento del produttore del browser) — coerente con un'app senza
// backend proprio. Supporto reale solo su Chrome/Edge/Safari recenti; Firefox non la
// implementa affatto, da cui il controllo esplicito invece di assumerla sempre presente.
export function isSpeechToTextSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

const LANG_MAP = { it: 'it-IT', en: 'en-US', fr: 'fr-FR' }

// Un solo hook per tutta l'app: la lingua del riconoscimento segue quella scelta
// nelle Impostazioni (useI18n), invece di un selettore separato solo per la dettatura.
export function useSpeechToText(lang) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  // Alcuni browser chiudono da soli la sessione dopo una pausa lunga anche con
  // continuous:true — questo distingue quel caso (da riavviare in automatico) da uno
  // stop esplicito dell'utente (da NON riavviare).
  const stoppedByUserRef = useRef(true)
  // Errori come permesso negato o nessun microfono non si risolvono da soli: senza
  // questo, onend li riavviava comunque (non era stato l'utente a fermarli), che a sua
  // volta falliva subito con lo stesso errore, in un loop infinito di avvio/errore che
  // non si fermava mai da solo — solo smontando il componente.
  const fatalErrorRef = useRef(false)

  function start() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('not-supported')
      return
    }
    setError('')
    setTranscript('')
    const recognition = new SpeechRecognition()
    recognition.lang = LANG_MAP[lang] || 'it-IT'
    recognition.continuous = true
    recognition.interimResults = true

    let finalText = ''
    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += chunk + ' '
        else interim += chunk
      }
      setTranscript((finalText + interim).trim())
    }
    recognition.onerror = (event) => {
      setError(event.error || 'error')
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
        fatalErrorRef.current = true
      }
    }
    recognition.onend = () => {
      if (stoppedByUserRef.current || fatalErrorRef.current) {
        setListening(false)
        return
      }
      try {
        recognition.start()
      } catch {
        setListening(false)
      }
    }

    fatalErrorRef.current = false
    stoppedByUserRef.current = false
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setError('start-failed')
    }
  }

  function stop() {
    stoppedByUserRef.current = true
    recognitionRef.current?.stop()
    setListening(false)
  }

  function reset() {
    setTranscript('')
  }

  // Se il componente si smonta mentre si sta ancora ascoltando (es. l'utente cambia
  // schermata), ferma il microfono invece di lasciarlo attivo in background.
  useEffect(() => () => {
    stoppedByUserRef.current = true
    recognitionRef.current?.stop()
  }, [])

  return { listening, transcript, error, start, stop, reset }
}
