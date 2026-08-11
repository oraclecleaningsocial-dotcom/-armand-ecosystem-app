# Magazzino Offline — App mobile scansione barcode/QR

App mobile (iOS + Android) per la gestione personale di un magazzino/deposito
(cantina, garage, dispensa, piccola scorta domestica...): scansione articoli
tramite fotocamera, registrazione automatica di entrate/uscite, anagrafica
prodotti con foto, storico movimenti e alert di scorta minima. **Funziona
interamente offline.**

Progettata per un solo utente, senza login, ruoli o permessi: si apre l'app
e si lavora.

---

## 1. Scelta dello stack tecnologico

**Flutter + SQLite locale (sqflite), nessun backend obbligatorio.**

| Requisito | Perché Flutter risponde bene |
|---|---|
| Offline-first assoluto | Il database SQLite vive sul dispositivo tramite `sqflite`: nessuna chiamata di rete è necessaria per scan, CRUD prodotti, movimenti o storico. I dati sono persistenti e durevoli quanto il file system del telefono. |
| Scansione barcode/QR | `mobile_scanner` usa i motori nativi (Google ML Kit su Android, AVFoundation/Vision su iOS) **completamente offline**, riconosce EAN-13, EAN-8, UPC, Code128, QR ecc. senza mai contattare un server. |
| Cross-platform iOS/Android | Un'unica codebase Dart compilata nativamente su entrambe le piattaforme, evitando di scrivere e mantenere due app separate — importante per un progetto di piccola scala mantenuto da una sola persona. |
| Foto prodotto offline | `image_picker` + `path_provider` salvano la foto nella sandbox dell'app (storage locale), nessun upload cloud richiesto. |
| Notifiche scorte basse offline | `flutter_local_notifications` genera notifiche **locali** sul dispositivo (non push da server): funzionano anche senza connessione, perché non serve alcun servizio esterno per attivarle. |
| Interfaccia semplice | Material 3, schermate ridotte all'osso, bottoni grandi, flusso guidato: scansiona → il sistema ti chiede "quanto entra/esce" → conferma. |

### Perché *non* un backend/cloud per l'MVP
Il requisito esplicito è: singolo utente, singolo dispositivo, magazzino senza
connessione. Con questi vincoli un backend aggiunge complessità (sync,
conflitti, autenticazione) senza risolvere un problema reale: non c'è un
secondo dispositivo con cui sincronizzare. Il DB SQLite locale **è** la fonte
di verità, sempre disponibile, sempre scrivibile, e sopravvive a riavvii e
assenza di rete per definizione (non deve "sincronizzarsi": è già lì).

Se in futuro servisse un backup cloud o un secondo dispositivo, si aggiunge in
un secondo momento (vedi Fase 3), senza dover riscrivere l'app: la si
aggancia come modulo di export/backup opzionale.

### Alternative scartate e perché
- **React Native/Expo**: valida alternativa, ma la scansione barcode offline
  matura richiede comunque moduli nativi (es. `vision-camera-code-scanner`)
  con setup più delicato; Flutter + `mobile_scanner` è oggi la combinazione
  più stabile "out of the box" per questo caso d'uso.
- **App web (PWA)**: scartata perché l'accesso alla fotocamera per la
  scansione barcode in modo affidabile e il funzionamento offline "duro"
  (nessuna rete per giorni) sono molto più fragili su web che con un'app
  nativa con storage nativo.

---

## 2. Architettura a step

### Fase 1 — MVP (questo repository)
- Anagrafica prodotti (nome, categoria, foto, soglia minima)
- Scansione barcode/QR con fotocamera
- Registrazione movimenti IN/OUT collegati al prodotto scansionato
- Aggiornamento automatico della giacenza
- Storico movimenti (data, ora, tipo, quantità, nota)
- Notifica locale quando la giacenza scende sotto soglia
- Tutto offline, storage locale SQLite + filesystem per le foto

### Fase 2 — Miglioramenti (parzialmente incluso in questo repository)
- ✅ Export CSV dello storico e dell'inventario, condiviso via il pannello di
  condivisione nativo (email, cloud, chiavetta...) — vedi `ExportService`
- ✅ Annullo di un movimento registrato per errore, con ripristino della
  giacenza precedente — azione disponibile nello Storico
- ✅ Rettifica giacenza dopo una conta fisica: si inserisce la quantità
  effettivamente contata e l'app genera in automatico il movimento IN/OUT
  necessario a colmare la differenza — azione disponibile nell'Elenco prodotti
- Categorie con icone/colori personalizzati (non incluso)
- Scanner "multi-scan" continuo per velocizzare la conta fisica di più
  articoli in sequenza, senza uscire dalla fotocamera (non incluso: la
  rettifica giacenza copre già il caso d'uso, ma articolo per articolo)

### Fase 3 — Opzionale, solo se servisse multi-dispositivo o cloud backup
- Un backend leggero (es. Supabase/Postgres) con tabella `sync_outbox` per le
  operazioni fatte offline, sincronizzate quando torna la connessione
  (pattern outbox: ogni scrittura locale viene accodata e inviata quando
  `connectivity_plus` rileva rete disponibile). Non necessario per il caso
  d'uso descritto (singolo utente/dispositivo).

---

## 3. Modello dati (SQLite locale)

```
categories
├── id            INTEGER PK AUTOINCREMENT
└── name          TEXT UNIQUE NOT NULL

products
├── id                  INTEGER PK AUTOINCREMENT
├── barcode             TEXT UNIQUE            -- null se prodotto senza codice
├── name                TEXT NOT NULL
├── category_id         INTEGER REFERENCES categories(id)
├── photo_path          TEXT                    -- percorso locale del file immagine
├── quantity            INTEGER NOT NULL DEFAULT 0   -- giacenza corrente (derivata dai movimenti)
├── min_threshold       INTEGER NOT NULL DEFAULT 0   -- soglia sotto la quale avvisare
├── low_stock_notified  INTEGER NOT NULL DEFAULT 0   -- evita notifiche ripetute finché non si riforma la scorta
├── created_at          TEXT NOT NULL
└── updated_at          TEXT NOT NULL

movements
├── id            INTEGER PK AUTOINCREMENT
├── product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE
├── type          TEXT NOT NULL CHECK(type IN ('IN','OUT'))
├── quantity      INTEGER NOT NULL
├── note          TEXT
└── created_at    TEXT NOT NULL
```

Regole applicative:
- Ogni movimento è **immutabile** (append-only): la giacenza (`products.quantity`)
  viene ricalcolata in transazione ad ogni inserimento (+quantity per IN,
  -quantity per OUT), così lo storico resta sempre coerente con la giacenza.
- Quando la giacenza scende `<= min_threshold` e `low_stock_notified = 0`,
  viene inviata una notifica locale e il flag passa a 1; quando torna sopra
  soglia il flag si azzera, così l'avviso può ripresentarsi al prossimo calo.

---

## 4. Struttura del progetto

```
warehouse-app/
├── pubspec.yaml
├── lib/
│   ├── main.dart
│   ├── theme/app_theme.dart
│   ├── data/app_database.dart          # apertura DB, schema, migrazioni
│   ├── models/
│   │   ├── category.dart
│   │   ├── product.dart
│   │   └── movement.dart
│   ├── repositories/
│   │   ├── category_repository.dart
│   │   ├── product_repository.dart
│   │   └── movement_repository.dart
│   ├── services/
│   │   ├── notification_service.dart   # notifiche locali scorte basse
│   │   ├── photo_storage_service.dart  # salvataggio foto in locale
│   │   └── export_service.dart         # export CSV inventario/storico + condivisione
│   ├── state/
│   │   └── inventory_provider.dart     # ChangeNotifier: orchestrazione UI <-> repository
│   ├── screens/
│   │   ├── home_screen.dart            # dashboard: scorte basse + ultimi movimenti + CTA scan
│   │   ├── scan_screen.dart            # fotocamera, lettura barcode/QR
│   │   ├── movement_screen.dart        # registra IN/OUT per il prodotto scansionato
│   │   ├── product_form_screen.dart    # crea/modifica anagrafica prodotto
│   │   ├── product_list_screen.dart    # elenco/ricerca, export, rettifica giacenza
│   │   └── history_screen.dart         # storico movimenti, export, annullo movimento
│   └── widgets/
│       ├── product_card.dart
│       └── stock_badge.dart
└── test/ (da aggiungere)
```

## 5. Schermate principali (flusso d'uso)

1. **Home**: bottone grande "Scansiona articolo" in evidenza, sotto la lista
   "Scorte basse" e "Ultimi movimenti". Accesso rapido a elenco prodotti e
   storico completo.
2. **Scan**: apre la fotocamera a schermo intero. Alla lettura di un codice:
   - prodotto trovato → apre subito la schermata Movimento precompilata;
   - prodotto non trovato → apre il form "Nuovo prodotto" con barcode già
     compilato, per censire l'articolo al volo.
3. **Movimento**: due bottoni grandi "Entrata" / "Uscita", quantità
   (stepper), nota opzionale, conferma. Aggiorna giacenza e storico.
4. **Anagrafica prodotto**: nome, categoria (con creazione rapida nuova
   categoria), foto (scatta o scegli da galleria), soglia minima scorta.
5. **Elenco prodotti**: ricerca per nome/barcode, badge colorato per
   evidenziare scorte basse, export CSV dell'inventario, rettifica giacenza
   dopo una conta fisica.
6. **Storico**: lista movimenti ordinata per data/ora, filtrabile per
   prodotto, export CSV, annullo di un movimento inserito per errore.

## 6. Setup ambiente di sviluppo

Questo repository contiene solo il codice Dart dell'app (`lib/` e
`pubspec.yaml`): gli scaffold nativi `android/` e `ios/` **non sono
inclusi** perché generati automaticamente da Flutter e legati alla versione
del toolchain di chi sviluppa. Per avviare il progetto:

```bash
# 1. Installare Flutter (https://docs.flutter.dev/get-started/install)
cd warehouse-app

# 2. Generare gli scaffold nativi mancanti (crea android/, ios/, ecc.)
flutter create .

# 3. Installare le dipendenze
flutter pub get

# 4. Aggiungere i permessi fotocamera (vedi sotto)

# 5. Avviare su un dispositivo/emulatore collegato
flutter run
```

### Permessi da aggiungere dopo `flutter create .`

**Android** — `android/app/src/main/AndroidManifest.xml`, dentro `<manifest>`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

**iOS** — `ios/Runner/Info.plist`, dentro `<dict>`:
```xml
<key>NSCameraUsageDescription</key>
<string>La fotocamera è usata per scansionare i codici a barre dei prodotti.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Serve per scegliere la foto di un prodotto dalla galleria.</string>
```

## 7. Note implementative

- **Nessuna generazione di codice richiesta**: si è scelto `sqflite` con SQL
  scritto a mano invece di un ORM con `build_runner` (es. Drift), per tenere
  il progetto immediatamente eseguibile senza step di generazione.
- **State management**: `provider` (ChangeNotifier) — sufficiente per un'app
  a singolo utente senza esigenze di stato complesse; evita di introdurre
  Riverpod/Bloc quando non serve.
- Il codice Dart (`lib/`) è stato validato con `flutter analyze` su Flutter
  3.44.7 stable (0 errori, 0 warning): staticamente corretto e coerente con
  le API attuali del framework. Non è stata eseguita una build APK/IPA
  completa (richiederebbe Android SDK/Xcode, non disponibili nell'ambiente
  in cui è stato scritto questo codice) né un avvio su emulatore/dispositivo
  reale: prima del primo `flutter run` va comunque fatto un giro di prova
  manuale delle funzionalità (scansione, notifiche, permessi).
