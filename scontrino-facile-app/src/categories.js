export const CATEGORIES = [
  { id: 'cibo', label: 'Cibo', icon: 'ShoppingCart', color: '#c8862a' },
  { id: 'trasporti', label: 'Trasporti', icon: 'Fuel', color: '#4c6b7a' },
  { id: 'casa', label: 'Casa', icon: 'Home', color: '#6b7b4c' },
  { id: 'salute', label: 'Salute', icon: 'HeartPulse', color: '#9c6b6b' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#7a6b9c' },
  { id: 'tempolibero', label: 'Tempo libero', icon: 'Popcorn', color: '#3f8a8c' },
  { id: 'altro', label: 'Altro', icon: 'MoreHorizontal', color: '#8a8578' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// Parole chiave per la categorizzazione automatica (primo tentativo, prima del mapping appreso).
const KEYWORDS = {
  cibo: ['esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'eurospin', 'pam', 'despar', 'md discount', 'panetteria', 'macelleria', 'alimentari', 'supermercato', 'iper', 'bennet', 'penny'],
  trasporti: ['eni', 'q8', 'ip ', 'esso', 'tamoil', 'autostrade', 'trenitalia', 'italo', 'atm', 'gtt', 'taxi', 'uber', 'parcheggio', 'benzina', 'gasolio', 'autogrill'],
  casa: ['ikea', 'leroy merlin', 'brico', 'mercatone', 'obi ', 'bricoman', 'casa mia', 'ferramenta'],
  salute: ['farmacia', 'parafarmacia', 'ospedale', 'clinica', 'dentista', 'ottica', 'ambulatorio'],
  shopping: ['zara', 'h&m', 'decathlon', 'mediaworld', 'unieuro', 'amazon', 'euronics', 'primark', 'oviesse'],
  tempolibero: ['cinema', 'teatro', 'palestra', 'gym', 'ristorante', 'pizzeria', 'trattoria', 'bar ', 'gelateria', 'osteria'],
}

export function normalizeMerchant(name) {
  return (name || '').trim().toLowerCase()
}

// Categorizzazione a livelli: mapping appreso dall'utente > parole chiave > fallback "altro".
export function guessCategory(merchantName, merchantCategoryMap) {
  const normalized = normalizeMerchant(merchantName)
  if (merchantCategoryMap && merchantCategoryMap[normalized]) {
    return merchantCategoryMap[normalized]
  }
  for (const [categoryId, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => normalized.includes(w))) return categoryId
  }
  return 'altro'
}
