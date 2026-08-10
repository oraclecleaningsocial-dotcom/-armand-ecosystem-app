# ScontrinoFacile — Design app iOS per gestione ricevute personali

> Documento di design prodotto per un'app iOS nativa (SwiftUI) dedicata alla scansione, archiviazione e analisi automatica delle ricevute di spesa personali/familiari. Valuta: solo Euro (€). Lingua interfaccia: italiano.

---

## 1. Flusso utente principale

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│   Home /    │ ──▶ │  Scansione   │ ──▶ │  Revisione OCR     │ ──▶ │  Salvataggio │
│  Dashboard  │     │  (fotocamera)│     │  (dati pre-compilati)│    │  automatico  │
└─────────────┘     └──────────────┘     └───────────────────┘     └──────┬───────┘
       ▲                                                                   │
       │                                                                   ▼
       │                                                          ┌──────────────┐
       └───────────────────  consultazione /  ◀──────────────────│  Ricevuta in │
                              ricerca / dashboard                 │  archivio    │
                                                                   └──────────────┘
```

Passo per passo, dal punto di vista dell'utente:

1. **Avvio scansione** — dalla Home, un unico pulsante grande e centrale ("+ Scansiona ricevuta") apre subito la fotocamera. Nessuna schermata intermedia, nessuna scelta da fare prima.
2. **Cattura** — l'utente inquadra lo scontrino; l'app rileva automaticamente i bordi (document scanner, come Apple Notes), corregge prospettiva e migliora contrasto/leggibilità in automatico. Scatto singolo, con opzione "aggiungi pagina" se lo scontrino è lungo (es. scontrino fiscale a rullo).
3. **Elaborazione OCR** — in 1-2 secondi l'app estrae: negozio/esercente, data, importo totale, singole voci (se leggibili), metodo di pagamento (se presente). Tutto avviene on-device, senza upload verso server esterni.
4. **Revisione rapida (pre-compilata, non un form vuoto)** — l'utente vede una scheda già compilata con i dati letti e la categoria suggerita. Deve solo *confermare* (un tap) oppure correggere il singolo campo sbagliato toccandolo. Non deve mai ripartire da zero.
5. **Salvataggio automatico** — al tap su "Conferma" (o anche in automatico dopo pochi secondi di inattività, con possibilità di annullare/modificare dopo), la ricevuta viene salvata: immagine + dati strutturati + categoria. Il totale mensile/annuale si aggiorna istantaneamente.
6. **Consultazione** — dalla Home o dalla Dashboard, l'utente può cercare, filtrare, aprire il dettaglio di ogni ricevuta, vedere l'immagine originale accanto ai dati letti, esportare o condividere.

Principio guida: **l'unico passaggio manuale previsto per design è la conferma/correzione dopo lo scatto** — mai un inserimento da campo vuoto.

---

## 2. Elenco funzionalità core

| Funzionalità | Descrizione |
|---|---|
| **Scansione con document scanner** | Cattura foto con rilevamento bordi automatico, correzione prospettica e ottimizzazione contrasto (basato su `VisionKit`/`VNDocumentCameraViewController`). |
| **OCR e lettura automatica** | Estrazione testo dallo scontrino (negozio, data, totale, voci) tramite motore OCR on-device. Il testo resta editabile: l'utente può toccare un campo e correggerlo. |
| **Calcolo automatico del totale** | Se l'OCR non individua con certezza un "totale", l'app somma le singole voci riconosciute e lo propone come fallback, segnalando "totale stimato" da confermare. |
| **Categorizzazione automatica** | Ogni ricevuta riceve una categoria (Cibo, Trasporti, Casa, Salute, Shopping, Tempo libero, Altro) dedotta dal nome dell'esercente/parole chiave. Correggibile con un tap; l'app impara dalle correzioni dell'utente (associazione negozio→categoria salvata). |
| **Archivio strutturato** | Ogni ricevuta è un record nel database (non solo un'immagine): negozio, data, importo, categoria, voci, note. L'immagine originale resta sempre allegata e consultabile. |
| **Ricerca e filtri** | Ricerca testuale (negozio, voce) + filtri per intervallo di date, categoria, intervallo di importo. Risultati istantanei mentre si digita. |
| **Totali automatici** | Calcolo continuo di totale giornaliero, mensile, annuale, aggiornato ad ogni salvataggio. Nessun ricalcolo manuale richiesto. |
| **Dashboard con grafici** | Riepilogo visivo: spesa per categoria (grafico a torta/barre), andamento mensile (grafico a linee), confronto con mese precedente. |
| **Esportazione/condivisione** | Esporta singola ricevuta (immagine o PDF con dati leggibili) o un riepilogo periodo (PDF/CSV) via il pannello di condivisione di iOS (email, Messaggi, salvataggio su file). |
| **Modifica manuale (secondaria)** | Tutti i campi restano modificabili in un secondo momento dal dettaglio ricevuta, per correggere errori OCR o aggiungere note — ma non è mai il percorso primario. |
| **Notifiche promemoria (opzionale)** | Promemoria gentile se non vengono scansionate ricevute da alcuni giorni, o riepilogo settimanale/mensile automatico. Disattivabile. |

Funzioni avanzate (multi-valuta, tag personalizzati, ricevute ricorrenti/abbonamenti, export contabile dettagliato) vanno **nascoste in un menu "Impostazioni avanzate"**, mai in primo piano.

---

## 3. Struttura dati/database suggerita

App client-only (nessun backend richiesto per l'uso base), persistenza locale con **SwiftData** (o Core Data se si punta a versioni iOS più vecchie), immagini su filesystem (`FileManager`, cartella Documents/Application Support) referenziate dal record.

```
Receipt (Ricevuta)
├─ id: UUID
├─ merchantName: String              // negozio/esercente, letto da OCR, editabile
├─ date: Date                        // data scontrino, letta da OCR (fallback: data scansione)
├─ totalAmount: Decimal              // importo totale in EUR
├─ totalSource: enum { ocrDetected, calculatedFromItems, manualOverride }
├─ category: Category                // relazione, assegnata automaticamente
├─ paymentMethod: String?            // opzionale, se OCR lo rileva (contanti/carta)
├─ notes: String?                    // nota libera opzionale
├─ imageFileName: String             // riferimento al file immagine originale
├─ ocrRawText: String                // testo grezzo OCR, per eventuale ri-parsing
├─ createdAt: Date
├─ updatedAt: Date
└─ items: [ReceiptItem]              // voci di dettaglio (0..n, opzionali se OCR non le legge)

ReceiptItem (Voce di scontrino)
├─ id: UUID
├─ receipt: Receipt                  // relazione inversa
├─ name: String                      // descrizione voce
├─ quantity: Decimal?                // opzionale
├─ unitPrice: Decimal?               // opzionale
└─ amount: Decimal                   // importo voce

Category (Categoria)
├─ id: UUID
├─ name: String                      // es. "Cibo", "Trasporti", "Casa", "Salute", "Shopping", "Tempo libero", "Altro"
├─ icon: String                      // nome SF Symbol
├─ colorHex: String                  // colore accento per grafici
└─ isSystemDefault: Bool             // categorie predefinite vs. create dall'utente

MerchantCategoryMapping (Apprendimento categorizzazione)
├─ id: UUID
├─ merchantNameNormalized: String    // chiave normalizzata (lowercase, trim)
├─ category: Category
└─ confirmedCount: Int               // quante volte l'utente ha confermato/corretto → rafforza la regola

// Entità derivate, calcolate a runtime (non persistite come tabelle separate,
// ma cache-abili per performance su archivi grandi):
DailyTotal   { date, totalAmount, byCategory: [Category: Decimal] }
MonthlyTotal { year, month, totalAmount, byCategory: [Category: Decimal] }
YearlyTotal  { year, totalAmount, byCategory: [Category: Decimal] }
```

Note di design dati:

- Il **totale non è mai solo un numero scritto a mano**: porta sempre con sé `totalSource`, così la UI può segnalare "totale stimato, verifica" quando proviene da somma voci anziché da lettura diretta.
- `MerchantCategoryMapping` è il cuore dell'"apprendimento automatico leggero": non serve un modello ML pesante, basta rafforzare l'associazione negozio→categoria ogni volta che l'utente conferma o corregge, e usarla come priorità sopra le regole a parole chiave.
- I totali per periodo si calcolano on-the-fly con query aggregate (`SwiftData`/`Core Data` fetch con predicati su `date` e `category`), evitando tabelle di riepilogo da tenere sincronizzate manualmente — coerente con "niente sforzo per l'utente, niente stato duplicato da mantenere".

---

## 4. Wireframe testuale delle schermate principali

### Home

```
┌───────────────────────────────┐
│  Ciao 👋           [⚙︎]        │
│                                 │
│  Questo mese hai speso          │
│  €  842,30                      │
│  ▁▂▃▅▄▂▇▃▂▁  (mini andamento)   │
│                                 │
│  ┌───────────────────────────┐ │
│  │      📷  Scansiona        │ │
│  │        ricevuta            │ │
│  └───────────────────────────┘ │
│                                 │
│  Ricevute recenti                │
│  ─────────────────────────────  │
│  🛒 Esselunga        -€ 34,20   │
│     oggi · Cibo                 │
│  ⛽ Eni               -€ 60,00  │
│     ieri · Trasporti            │
│  💊 Farmacia Centrale -€ 12,50  │
│     2 giorni fa · Salute        │
│                                 │
│  [ Vedi tutte ]                 │
│                                 │
│ ─────────────────────────────── │
│  🏠      🔍      📷      📊     │
│ Home  Ricerca  Scansiona  Report│
└───────────────────────────────┘
```

### Scansione

```
┌───────────────────────────────┐
│  ✕                              │
│                                 │
│   ┌───────────────────────┐    │
│   │                       │    │
│   │   [mirino fotocamera] │    │
│   │   bordi scontrino     │    │
│   │   rilevati in verde   │    │
│   │                       │    │
│   └───────────────────────┘    │
│                                 │
│      Inquadra lo scontrino      │
│                                 │
│         ⚪ (scatta)             │
│                                 │
│   [ + Aggiungi un'altra pagina ]│
└───────────────────────────────┘
```

### Revisione post-OCR (compare subito dopo lo scatto)

```
┌───────────────────────────────┐
│  ✕              Salva  ✓       │
│                                 │
│   [thumbnail immagine scontrino]│
│                                 │
│  Negozio                        │
│  Esselunga                  ✎   │
│                                 │
│  Data                           │
│  10 ago 2026                ✎   │
│                                 │
│  Totale                         │
│  € 34,20                    ✎   │
│  ✓ letto dallo scontrino         │
│                                 │
│  Categoria                      │
│  🛒 Cibo  ▾  (suggerita)         │
│                                 │
│  ▸ Vedi voci lette (7)          │
│                                 │
│  Nota (opzionale)                │
│  ＋ Aggiungi nota                │
└───────────────────────────────┘
```

### Dettaglio ricevuta

```
┌───────────────────────────────┐
│  ‹ Indietro          ⋯          │
│                                 │
│   [immagine scontrino, tap per  │
│    ingrandire a schermo intero] │
│                                 │
│  Esselunga                      │
│  10 agosto 2026 · Cibo 🛒        │
│                                 │
│  Totale            € 34,20      │
│                                 │
│  Voci                           │
│  ─────────────────────────────  │
│  Pasta                  € 2,10  │
│  Latte                  € 1,80  │
│  Pane                   € 3,00  │
│  ...                            │
│                                 │
│  Fonte input: scansione OCR     │
│  del 10/08/2026 alle 18:42      │
│                                 │
│  [ Condividi ]   [ Esporta PDF ]│
└───────────────────────────────┘
```

### Dashboard (report)

```
┌───────────────────────────────┐
│  Report              [Mese ▾]   │
│                                 │
│  Speso questo mese               │
│  € 842,30                       │
│  ▲ +12% rispetto al mese scorso │
│                                 │
│  Per categoria                   │
│  ┌───────────────────────────┐  │
│  │      ◔ grafico a torta     │  │
│  └───────────────────────────┘  │
│  🛒 Cibo         € 320,10  38%  │
│  ⛽ Trasporti    € 180,00  21%  │
│  💊 Salute       € 90,50   11%  │
│  🏠 Casa         € 251,70  30%  │
│                                 │
│  Andamento ultimi 6 mesi         │
│  ┌───────────────────────────┐  │
│  │     📈 grafico a linee     │  │
│  └───────────────────────────┘  │
│                                 │
│  [ Esporta riepilogo periodo ]  │
└───────────────────────────────┘
```

### Ricerca

```
┌───────────────────────────────┐
│  🔍  Cerca negozio, voce...     │
│                                 │
│  Filtri:  [Data ▾] [Categoria ▾]│
│           [Importo ▾]           │
│                                 │
│  Risultati (14)                 │
│  ─────────────────────────────  │
│  🛒 Esselunga        -€ 34,20   │
│     10 ago · Cibo                │
│  🛒 Coop              -€ 22,00  │
│     3 ago · Cibo                 │
│  ⛽ Eni               -€ 60,00  │
│     1 ago · Trasporti            │
│  ...                            │
└───────────────────────────────┘
```

Principi trasversali di layout: navigazione a **tab bar di 4 voci** (Home, Ricerca, Scansiona al centro in evidenza, Report), palette bianco/grigio neutro con un solo colore accento per CTA e stato positivo/negativo dei totali, tipografia con forte gerarchia (importo totale sempre il testo più grande della schermata), e la dicitura discreta "Fonte input: ..." su ogni scheda dove il dato proviene da un'elaborazione automatica, per trasparenza senza appesantire la UI.

---

## 5. Note tecniche su OCR e categorizzazione automatica

**Cattura e OCR (100% on-device, nessun invio dati a server esterni — punto di forza per privacy su spese personali):**

- **Cattura documento**: `VNDocumentCameraViewController` (VisionKit) per rilevamento bordi automatico, correzione prospettica e miglioramento immagine — stesso motore usato da Apple Notes per la scansione documenti.
- **Riconoscimento testo**: `VNRecognizeTextRequest` (framework Vision) con `recognitionLevel = .accurate` e `recognitionLanguages = ["it-IT"]`. Restituisce blocchi di testo con bounding box, utili per capire la posizione (es. il totale è quasi sempre nel terzo inferiore dello scontrino, in grassetto/font più grande).
- **Parsing strutturato** (livello sopra l'OCR grezzo, in Swift):
  - **Totale**: ricerca di righe contenenti pattern come `TOTALE`, `TOTALE EURO`, `IMPORTO`, seguiti da un numero in formato `xx,xx €` o `€ xx,xx`; tra più candidati si preferisce quello con font/bounding box più grande o posizione più in basso nello scontrino. Se nessun pattern è riconosciuto con sufficiente confidenza, fallback: somma delle righe-voce riconosciute come prezzo (pattern numerico a fine riga), marcata come "totale stimato".
  - **Data**: regex su formati comuni italiani (`gg/mm/aaaa`, `gg-mm-aa`, ecc.), con fallback alla data/ora dello scatto se non trovata.
  - **Esercente**: tipicamente le prime 1-3 righe del testo OCR, in maiuscolo/font più grande in alto allo scontrino; euristica su posizione + heuristics (scarta righe che sono solo numeri, indirizzi con P.IVA/C.F.).
  - **Voci**: righe che terminano con un pattern prezzo (`\d+,\d{2}`), con descrizione = testo prima del prezzo. Qualità variabile a seconda dello scontrino (accettabile che non sia perfetto: l'utente può sempre correggere, e il totale resta comunque affidabile anche se le singole voci non lo sono).
- **Editabilità**: il testo OCR grezzo (`ocrRawText`) va sempre conservato nel record, anche dopo il parsing — permette in futuro di ri-processare con euristiche migliorate senza dover far riscansionare l'utente.

**Categorizzazione automatica:**

- **Primo livello — mapping appreso**: se `merchantNameNormalized` esiste già in `MerchantCategoryMapping` (perché l'utente ha già confermato/corretto quel negozio in passato), usa direttamente quella categoria. Questo è il meccanismo più affidabile e migliora nel tempo senza bisogno di modelli complessi.
- **Secondo livello — regole a parole chiave**: dizionario locale di parole chiave/nomi comuni di catene italiane per categoria (es. Esselunga/Coop/Conad/Carrefour → Cibo; Eni/Q8/Ip → Trasporti; Farmacia/Parafarmacia → Salute; Ikea/Leroy Merlin → Casa; Zara/H&M → Shopping), con matching case-insensitive e tollerante a varianti (contiene/inizia con).
- **Terzo livello — fallback**: se nessuna regola scatta, categoria "Altro", sempre correggibile con un tap; la correzione alimenta subito il mapping appreso per la prossima volta.
- Non è necessario un modello Core ML addestrato per il lancio: l'euristica a due livelli (mapping personale + dizionario) copre la maggior parte dei casi reali per un singolo utente/famiglia, con complessità e footprint minimi. Un classificatore Core ML testuale può essere un'evoluzione futura se si vuole generalizzare oltre le catene note, ma va trattato come funzione avanzata, non come requisito di lancio.

**Performance e affidabilità:**

- L'elaborazione OCR (scatto → dati pre-compilati) deve restare percepita come istantanea: target sotto i 2 secondi su dispositivi recenti, eseguendo `VNRecognizeTextRequest` in background subito dopo la cattura, mentre l'utente vede ancora l'anteprima dell'immagine.
- Le immagini originali vanno sempre conservate (mai solo il testo estratto): sono la prova/verifica in caso di dato letto male, e servono per l'esportazione PDF/condivisione.
- Backup: se in futuro si abilita iCloud/CloudKit sync, sincronizzare sia i record strutturati sia i file immagine, mantenendo tutto on-device/nel proprio iCloud personale — coerente con l'uso privato e la sensibilità dei dati di spesa.
