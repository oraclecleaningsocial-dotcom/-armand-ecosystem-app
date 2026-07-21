import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// Punto di accesso unico al database SQLite locale.
///
/// Tutta la persistenza dell'app vive qui: nessuna chiamata di rete è
/// coinvolta in lettura o scrittura, per soddisfare il requisito di
/// funzionamento offline completo.
class AppDatabase {
  AppDatabase._internal();

  static final AppDatabase instance = AppDatabase._internal();

  static const int _schemaVersion = 1;

  Database? _database;

  Future<Database> get database async {
    _database ??= await _open();
    return _database!;
  }

  Future<Database> _open() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, 'warehouse.db');

    return openDatabase(
      path,
      version: _schemaVersion,
      onConfigure: (db) async {
        await db.execute('PRAGMA foreign_keys = ON');
      },
      onCreate: _createSchema,
      // Le prossime versioni di schema aggiungeranno qui i propri blocchi
      // `if (oldVersion < N) { ... }` per le migrazioni incrementali.
      onUpgrade: (db, oldVersion, newVersion) async {},
    );
  }

  Future<void> _createSchema(Database db, int version) async {
    await db.execute('''
      CREATE TABLE categories (
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    ''');

    await db.execute('''
      CREATE TABLE products (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode             TEXT UNIQUE,
        name                TEXT NOT NULL,
        category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        photo_path          TEXT,
        quantity            INTEGER NOT NULL DEFAULT 0,
        min_threshold       INTEGER NOT NULL DEFAULT 0,
        low_stock_notified  INTEGER NOT NULL DEFAULT 0,
        created_at          TEXT NOT NULL,
        updated_at          TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE movements (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        type        TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
        quantity    INTEGER NOT NULL CHECK (quantity > 0),
        note        TEXT,
        created_at  TEXT NOT NULL
      )
    ''');

    await db.execute('CREATE INDEX idx_products_barcode ON products(barcode)');
    await db.execute('CREATE INDEX idx_products_category ON products(category_id)');
    await db.execute('CREATE INDEX idx_movements_product ON movements(product_id)');
    await db.execute('CREATE INDEX idx_movements_created_at ON movements(created_at)');
  }

  Future<void> close() async {
    final db = _database;
    if (db != null) {
      await db.close();
      _database = null;
    }
  }
}
