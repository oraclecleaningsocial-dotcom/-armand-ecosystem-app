// Un vero "cerca online il logo esatto della carta" alla Stocard richiederebbe un
// database proprietario di migliaia di design di carte (quello che Stocard ha costruito
// in anni) — cosa che un'app senza backend non ha. Ci si avvicina in due passi, sempre
// client-side, senza server né chiave API propri: una lista curata delle catene più
// comuni con il loro dominio ufficiale, usato per recuperare il logo vero da Clearbit
// (https://logo.clearbit.com/<dominio>, servizio pubblico gratuito e senza autenticazione,
// pensato apposta per questo). Se il logo non si carica (rete assente, dominio cambiato,
// ecc.) si ripiega sul colore della catena — vedi BrandCover in LoyaltyCards.jsx — così una
// carta digitata come "Esselunga" o "IKEA" ha comunque subito un aspetto "di marca" anche
// offline, invece della sola icona generica.
export const KNOWN_STORES = [
  { name: 'IKEA Family', color: '#0058a3', domain: 'ikea.com' },
  { name: 'Esselunga', color: '#e2001a', domain: 'esselunga.it' },
  { name: 'Coop', color: '#e2001a', domain: 'e-coop.it' },
  { name: 'Conad', color: '#f39200', domain: 'conad.it' },
  { name: 'Lidl', color: '#0050aa', domain: 'lidl.it' },
  { name: 'Eurospin', color: '#004b93', domain: 'eurospin.it' },
  { name: 'Pam Panorama', color: '#e30613', domain: 'pampanorama.it' },
  { name: 'Carrefour', color: '#0055a4', domain: 'carrefour.it' },
  { name: 'Decathlon', color: '#0082c3', domain: 'decathlon.it' },
  { name: 'MediaWorld', color: '#e2001a', domain: 'mediaworld.it' },
  { name: 'Unieuro', color: '#0033a0', domain: 'unieuro.it' },
  { name: 'Leroy Merlin', color: '#78be20', domain: 'leroymerlin.it' },
  { name: 'Douglas', color: '#1a1a1a', domain: 'douglas.it' },
  { name: 'Zara', color: '#1a1a1a', domain: 'zara.com' },
  { name: 'H&M', color: '#e50010', domain: 'hm.com' },
  { name: 'OVS', color: '#e2001a', domain: 'ovs.it' },
  { name: 'Despar', color: '#005baa', domain: 'despar.it' },
  { name: 'Bennet', color: '#e2001a', domain: 'bennet.com' },
  { name: 'Auchan', color: '#e2001a', domain: 'auchan.it' },
  { name: 'Tigotà', color: '#e6007e', domain: 'tigota.it' },
]

export function brandLogoUrl(brand) {
  return brand?.domain ? `https://logo.clearbit.com/${brand.domain}?size=128` : null
}

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
