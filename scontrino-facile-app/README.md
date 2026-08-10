# ScontrinoFacile

App web (React + Vite) per la gestione automatica delle ricevute personali: scansiona, l'OCR legge negozio/data/totale/voci, categorizza in automatico, tu confermi con un tocco. Valuta: solo Euro. Persistenza locale (`localStorage`), nessun backend, nessun dato inviato a server esterni — l'OCR gira interamente nel browser (Tesseract.js).

## Avvio

```bash
npm install
npm run dev       # http://localhost:5173, --host 0.0.0.0
npm run build     # build di produzione in dist/
npm run preview   # anteprima della build
```

## Come funziona

- **Scansione**: `src/screens/Scan.jsx` apre la fotocamera del dispositivo (`<input type="file" capture="environment">`), poi passa l'immagine a `src/ocr.js`.
- **OCR**: `src/ocr.js` usa Tesseract.js (worker + motore wasm serviti insieme all'app, non da CDN) per leggere il testo, poi lo interpreta con euristiche su negozio/data/totale/voci. Se il totale non è riconosciuto direttamente, viene calcolato dalla somma delle voci lette (`totalSource: 'calculatedFromItems'`).
- **Categorizzazione**: `src/categories.js` assegna una categoria in base a un dizionario di parole chiave per gli esercenti italiani più comuni; ogni conferma/correzione dell'utente rafforza un mapping personale (`merchantCategoryMap` in `src/state.js`) che ha sempre priorità.
- **Stato e persistenza**: `src/state.js` espone l'hook `useReceipts()` (localStorage, chiave `scontrino_facile_state`) e le funzioni di aggregazione per i totali per periodo e l'andamento degli ultimi 6 mesi.
- **Schermate**: Home, Ricerca, Scansione/Revisione, Dettaglio, Report — in `src/screens/`, orchestrate da `src/App.jsx`.
- **Export**: dalla Dashboard, "Esporta riepilogo" scarica un CSV del periodo corrente (`src/utils/csv.js`).

Nota: al primo utilizzo l'OCR scarica i dati della lingua italiana (~4MB, poi restano in cache del browser) — serve una connessione internet la prima volta.
