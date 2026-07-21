import 'package:sqflite/sqflite.dart';

import '../data/app_database.dart';
import '../models/movement.dart';
import '../models/product.dart';

/// Esito della registrazione di un movimento: la nuova giacenza e se
/// occorre inviare (o meno) una notifica di scorta bassa.
class MovementResult {
  final Product updatedProduct;
  final bool shouldNotifyLowStock;

  const MovementResult({
    required this.updatedProduct,
    required this.shouldNotifyLowStock,
  });
}

class MovementRepository {
  Future<Database> get _db async => AppDatabase.instance.database;

  Future<List<Movement>> getHistory({int? productId}) async {
    final db = await _db;
    final hasFilter = productId != null;

    final rows = await db.rawQuery(
      '''
      SELECT movements.*, products.name AS product_name
      FROM movements
      JOIN products ON products.id = movements.product_id
      ${hasFilter ? 'WHERE movements.product_id = ?' : ''}
      ORDER BY movements.created_at DESC, movements.id DESC
      ''',
      hasFilter ? [productId] : null,
    );

    return rows.map(Movement.fromMap).toList();
  }

  /// Registra un movimento IN/OUT e aggiorna la giacenza del prodotto in
  /// un'unica transazione, così storico e giacenza non possono mai
  /// disallinearsi (es. per un crash a metà operazione).
  ///
  /// La giacenza non scende mai sotto zero: un'uscita superiore alla
  /// giacenza disponibile viene comunque registrata ma limitata a zero,
  /// per non introdurre incongruenze contabili silenziose.
  Future<MovementResult> register({
    required Product product,
    required MovementType type,
    required int quantity,
    String? note,
  }) async {
    final db = await _db;

    return db.transaction<MovementResult>((txn) async {
      final rows = await txn.query(
        'products',
        where: 'id = ?',
        whereArgs: [product.id],
        limit: 1,
      );
      final current = Product.fromMap(rows.first);

      final rawNewQuantity = type == MovementType.inbound
          ? current.quantity + quantity
          : current.quantity - quantity;
      final newQuantity = rawNewQuantity < 0 ? 0 : rawNewQuantity;

      final isBelowThreshold = newQuantity <= current.minThreshold;
      final shouldNotify = isBelowThreshold && !current.lowStockNotified;

      final now = DateTime.now();

      await txn.update(
        'products',
        {
          'quantity': newQuantity,
          'low_stock_notified': isBelowThreshold ? 1 : 0,
          'updated_at': now.toIso8601String(),
        },
        where: 'id = ?',
        whereArgs: [product.id],
      );

      await txn.insert('movements', {
        'product_id': product.id,
        'type': type.dbValue,
        'quantity': quantity,
        'note': note,
        'created_at': now.toIso8601String(),
      });

      return MovementResult(
        updatedProduct: current.copyWith(
          quantity: newQuantity,
          lowStockNotified: isBelowThreshold,
          updatedAt: now,
        ),
        shouldNotifyLowStock: shouldNotify,
      );
    });
  }
}
