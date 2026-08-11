import 'package:sqflite/sqflite.dart';

import '../data/app_database.dart';
import '../models/product.dart';

class ProductRepository {
  Future<Database> get _db async => AppDatabase.instance.database;

  static const String _selectWithCategory = '''
    SELECT products.*, categories.name AS category_name
    FROM products
    LEFT JOIN categories ON categories.id = products.category_id
  ''';

  Future<List<Product>> getAll({String? searchTerm}) async {
    final db = await _db;
    final hasSearch = searchTerm != null && searchTerm.trim().isNotEmpty;

    final rows = await db.rawQuery(
      '''
      $_selectWithCategory
      ${hasSearch ? 'WHERE products.name LIKE ? OR products.barcode LIKE ?' : ''}
      ORDER BY products.name COLLATE NOCASE ASC
      ''',
      hasSearch ? ['%${searchTerm.trim()}%', '%${searchTerm.trim()}%'] : null,
    );

    return rows.map(Product.fromMap).toList();
  }

  Future<List<Product>> getLowStock() async {
    final db = await _db;
    final rows = await db.rawQuery('''
      $_selectWithCategory
      WHERE products.quantity <= products.min_threshold
      ORDER BY products.quantity ASC
    ''');
    return rows.map(Product.fromMap).toList();
  }

  Future<Product?> getById(int id) async {
    final db = await _db;
    final rows = await db.rawQuery(
      '$_selectWithCategory WHERE products.id = ? LIMIT 1',
      [id],
    );
    if (rows.isEmpty) return null;
    return Product.fromMap(rows.first);
  }

  Future<Product?> findByBarcode(String barcode) async {
    final db = await _db;
    final rows = await db.rawQuery(
      '$_selectWithCategory WHERE products.barcode = ? LIMIT 1',
      [barcode],
    );
    if (rows.isEmpty) return null;
    return Product.fromMap(rows.first);
  }

  Future<Product> create(Product product) async {
    final db = await _db;
    final id = await db.insert('products', product.toMap());
    return product.copyWith(id: id);
  }

  Future<void> update(Product product) async {
    final db = await _db;
    await db.update(
      'products',
      product.toMap(),
      where: 'id = ?',
      whereArgs: [product.id],
    );
  }

  Future<void> delete(int id) async {
    final db = await _db;
    await db.delete('products', where: 'id = ?', whereArgs: [id]);
  }
}
