// Un vero "cerca online il logo esatto della carta" alla Stocard richiederebbe un
// database proprietario di migliaia di design di carte (quello che Stocard ha costruito
// in anni) o un servizio esterno con chiave API — cose che un'app senza backend non ha.
// Qui ci si avvicina in un altro modo, sempre client-side: una lista curata delle catene
// più comuni con il loro colore riconoscibile, così una carta digitata come "Esselunga"
// o "IKEA" prende subito un aspetto "di marca" (colore, non un logo copiato da internet)
// invece della sola icona generica — utile a colpo d'occhio come un vero portafoglio,
// senza dipendere da una ricerca online che potrebbe non funzionare offline o alla cassa.
export const KNOWN_STORES = [
  { name: 'IKEA Family', color: '#0058a3' },
  { name: 'Esselunga', color: '#e2001a' },
  { name: 'Coop', color: '#e2001a' },
  { name: 'Conad', color: '#f39200' },
  { name: 'Lidl', color: '#0050aa' },
  { name: 'Eurospin', color: '#004b93' },
  { name: 'Pam Panorama', color: '#e30613' },
  { name: 'Carrefour', color: '#0055a4' },
  { name: 'Decathlon', color: '#0082c3' },
  { name: 'MediaWorld', color: '#e2001a' },
  { name: 'Unieuro', color: '#0033a0' },
  { name: 'Leroy Merlin', color: '#78be20' },
  { name: 'Douglas', color: '#1a1a1a' },
  { name: 'Zara', color: '#1a1a1a' },
  { name: 'H&M', color: '#e50010' },
  { name: 'OVS', color: '#e2001a' },
  { name: 'Despar', color: '#005baa' },
  { name: 'Bennet', color: '#e2001a' },
  { name: 'Auchan', color: '#e2001a' },
  { name: 'Tigotà', color: '#e6007e' },
]

// Riconoscimento tollerante: digitando "ikea" si vuole trovare "IKEA Family" e viceversa,
// senza dover scrivere il nome esatto della catena. Confronto in entrambe le direzioni
// (il nome digitato può essere più corto o più lungo di quello in lista).
export function matchStoreBrand(label) {
  const needle = label.trim().toLowerCase()
  if (!needle) return null
  return KNOWN_STORES.find((s) => {
    const hay = s.name.toLowerCase()
    return hay.includes(needle) || needle.includes(hay)
  }) || null
}
