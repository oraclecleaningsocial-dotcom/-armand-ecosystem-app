import { useIdbState } from './idb'

const STORAGE_KEY = 'scontrino_facile_products'
const IDB_KEY = 'products'

// IndexedDB invece di localStorage (stesso motivo di state.js/idb.js: le immagini dei
// prodotti da Open Food Facts si accumulano nel tempo), con migrazione una tantum di
// eventuali prodotti ancora nel vecchio localStorage.
export function useProducts() {
  return useIdbState(IDB_KEY, [], { legacyKey: STORAGE_KEY })
}

// Cerca il prodotto su Open Food Facts tramite codice a barre (EAN/UPC): è un database
// pubblico, gratuito e senza chiave — l'unica fonte reale di dati nutrizionali che
// un'app client-only senza backend può interrogare direttamente dal dispositivo.
// Non copre la ricerca prezzi in altri negozi né recensioni della community: quelle
// richiederebbero un server/scraping che questo prototipo non ha.
export async function lookupBarcode(barcode) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`)
  if (!res.ok) throw new Error('Richiesta non riuscita. Controlla la connessione e riprova.')
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null
  const p = data.product
  const n = p.nutriments || {}
  return {
    barcode,
    name: p.product_name_it || p.product_name || '',
    brand: p.brands || '',
    imageUrl: p.image_front_small_url || p.image_url || '',
    nutriScore: (p.nutriscore_grade || '').toUpperCase() || null,
    novaGroup: p.nova_group || null,
    ecoScore: (p.ecoscore_grade || '').toUpperCase() || null,
    calories: n['energy-kcal_100g'] ?? null,
    carbs: n.carbohydrates_100g ?? null,
    sugars: n.sugars_100g ?? null,
    proteins: n.proteins_100g ?? null,
    fat: n.fat_100g ?? null,
    salt: n.salt_100g ?? null,
    ingredients: p.ingredients_text_it || p.ingredients_text || '',
  }
}

export const NOVA_LABELS = {
  1: 'Non trasformato o minimamente trasformato',
  2: 'Ingrediente culinario trasformato',
  3: 'Alimento trasformato',
  4: 'Ultra-trasformato',
}
