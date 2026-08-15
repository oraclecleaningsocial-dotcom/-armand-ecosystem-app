import { createContext, useContext, useState } from 'react'
import { TRANSLATIONS } from './translations'
import { setFormatLocale } from '../utils/format'

const STORAGE_KEY = 'scontrino_facile_lang'

export const LANGUAGES = [
  { id: 'it', label: 'Italiano' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
]

function loadLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && TRANSLATIONS[saved]) return saved
  } catch {
    // localStorage non disponibile: si resta sull'italiano
  }
  return 'it'
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang)
  setFormatLocale(lang)

  function setLang(next) {
    if (!TRANSLATIONS[next]) return
    setLangState(next)
    setFormatLocale(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage non disponibile: la scelta vale solo per questa sessione
    }
  }

  function t(key, vars) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.it
    let str = dict[key] ?? TRANSLATIONS.it[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v)
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
