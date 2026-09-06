// Colori ripensati per il tema chiaro: le tonalità smorzate che si leggevano bene su
// sfondo scuro risultavano spente/poco leggibili su carta bianca, quindi più
// saturazione a parità di tinta (stessa identità per categoria, solo più vivida) —
// Cibo esclusa perché il blu era già leggibile su entrambi gli sfondi.
export const CATEGORIES = [
  { id: 'cibo', label: 'Cibo', icon: 'ShoppingCart', color: '#3B82F6' },
  { id: 'trasporti', label: 'Trasporti', icon: 'Fuel', color: '#1F8FBF' },
  { id: 'casa', label: 'Casa', icon: 'Home', color: '#4C9A4C' },
  { id: 'salute', label: 'Salute', icon: 'HeartPulse', color: '#D9607A' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#8A63D2' },
  { id: 'tempolibero', label: 'Tempo libero', icon: 'Popcorn', color: '#17A398' },
  { id: 'altro', label: 'Altro', icon: 'MoreHorizontal', color: '#9C9683' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// Parole chiave per la categorizzazione automatica (primo tentativo, prima del mapping appreso).
const KEYWORDS = {
  cibo: ['esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'eurospin', 'pam', 'despar', 'md discount', 'panetteria', 'macelleria', 'alimentari', 'supermercato', 'iper', 'bennet', 'penny'],
  trasporti: ['eni', 'q8', 'ip ', 'esso', 'tamoil', 'autostrade', 'trenitalia', 'italo', 'atm', 'gtt', 'taxi', 'uber', 'parcheggio', 'benzina', 'gasolio', 'autogrill'],
  casa: ['ikea', 'leroy merlin', 'brico', 'mercatone', 'obi ', 'bricoman', 'casa mia', 'ferramenta', 'enel', 'a2a', 'hera', 'iren', 'acea', 'eni gas e luce', 'sorgenia', 'condominio'],
  salute: ['farmacia', 'parafarmacia', 'ospedale', 'clinica', 'dentista', 'ottica', 'ambulatorio'],
  shopping: ['zara', 'h&m', 'decathlon', 'mediaworld', 'unieuro', 'amazon', 'euronics', 'primark', 'oviesse'],
  tempolibero: ['cinema', 'teatro', 'palestra', 'gym', 'ristorante', 'pizzeria', 'trattoria', 'bar ', 'gelateria', 'osteria'],
}

// Parole chiave cercate nelle singole voci lette dallo scontrino, usate solo se il nome
// dell'esercente da solo non basta (es. bonifico/pagamento con beneficiario generico ma
// causale "bolletta luce").
const ITEM_KEYWORDS = {
  casa: ['bolletta', 'luce', 'gas', 'acqua', 'condominio', 'affitto', 'canone', 'utenza', 'internet', 'telefono fisso'],
  salute: ['farmaco', 'medicin', 'ricetta'],
  trasporti: ['benzina', 'gasolio', 'pedaggio', 'biglietto treno', 'biglietto bus', 'abbonamento mezzi'],
}

export function normalizeMerchant(name) {
  return (name || '').trim().toLowerCase()
}

// Categorizzazione a livelli: mapping appreso dall'utente > parole chiave sull'esercente >
// parole chiave sulle voci lette (es. "bolletta") > fallback "altro".
export function guessCategory(merchantName, merchantCategoryMap, itemNames = []) {
  const normalized = normalizeMerchant(merchantName)
  if (merchantCategoryMap && merchantCategoryMap[normalized]) {
    return merchantCategoryMap[normalized]
  }
  for (const [categoryId, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => normalized.includes(w))) return categoryId
  }
  const itemsText = itemNames.map(normalizeMerchant).join(' ')
  if (itemsText) {
    for (const [categoryId, words] of Object.entries(ITEM_KEYWORDS)) {
      if (words.some((w) => itemsText.includes(w))) return categoryId
    }
  }
  return 'altro'
}
