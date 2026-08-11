import 'package:sqflite/sqflite.dart';

import '../data/app_database.dart';
import '../models/category.dart';

class CategoryRepository {
  Future<Database> get _db async => AppDatabase.instance.database;

  Future<List<ProductCategory>> getAll() async {
    final db = await _db;
    final rows = await db.query('categories', orderBy: 'name ASC');
    return rows.map(ProductCategory.fromMap).toList();
  }

  /// Crea la categoria se non esiste già (per nome, case-insensitive) e
  /// restituisce sempre l'istanza persistita.
  Future<ProductCategory> getOrCreate(String name) async {
    final db = await _db;
    final trimmed = name.trim();

    final existing = await db.query(
      'categories',
      where: 'LOWER(name) = LOWER(?)',
      whereArgs: [trimmed],
      limit: 1,
    );
    if (existing.isNotEmpty) {
      return ProductCategory.fromMap(existing.first);
    }

    final id = await db.insert('categories', {'name': trimmed});
    return ProductCategory(id: id, name: trimmed);
  }
}
