import 'package:flutter/foundation.dart';

import '../models/category.dart';
import '../models/movement.dart';
import '../models/product.dart';
import '../repositories/category_repository.dart';
import '../repositories/movement_repository.dart';
import '../repositories/product_repository.dart';
import '../services/notification_service.dart';
import '../services/photo_storage_service.dart';

/// Unico punto di orchestrazione tra UI, repository SQLite e servizi
/// (notifiche, foto). Le schermate leggono lo stato esposto qui e non
/// parlano mai direttamente con il database.
class InventoryProvider extends ChangeNotifier {
  InventoryProvider({
    ProductRepository? productRepository,
    CategoryRepository? categoryRepository,
    MovementRepository? movementRepository,
    NotificationService? notificationService,
    PhotoStorageService? photoStorageService,
  })  : _products = productRepository ?? ProductRepository(),
        _categories = categoryRepository ?? CategoryRepository(),
        _movements = movementRepository ?? MovementRepository(),
        _notifications = notificationService ?? NotificationService.instance,
        _photos = photoStorageService ?? PhotoStorageService();

  final ProductRepository _products;
  final CategoryRepository _categories;
  final MovementRepository _movements;
  final NotificationService _notifications;
  final PhotoStorageService _photos;

  bool _isLoading = true;
  bool get isLoading => _isLoading;

  List<Product> _productList = [];
  List<Product> get productList => _productList;

  List<Product> _lowStockList = [];
  List<Product> get lowStockList => _lowStockList;

  List<ProductCategory> _categoryList = [];
  List<ProductCategory> get categoryList => _categoryList;

  List<Movement> _recentMovements = [];
  List<Movement> get recentMovements => _recentMovements;

  Future<void> init() async {
    // Le notifiche sono un extra: se l'inizializzazione fallisse per un
    // qualsiasi motivo (permesso negato, servizio di sistema assente...),
    // l'app deve comunque aprirsi e restare utilizzabile offline.
    try {
      await _notifications.init();
    } catch (error) {
      debugPrint('Notifiche non disponibili: $error');
    }

    await Future.wait([refreshProducts(), refreshCategories(), refreshHistory()]);
    _isLoading = false;
    notifyListeners();
  }

  Future<void> refreshProducts({String? searchTerm}) async {
    _productList = await _products.getAll(searchTerm: searchTerm);
    _lowStockList = await _products.getLowStock();
    notifyListeners();
  }

  Future<void> refreshCategories() async {
    _categoryList = await _categories.getAll();
    notifyListeners();
  }

  Future<void> refreshHistory({int? productId}) async {
    _recentMovements = await _movements.getHistory(productId: productId);
    notifyListeners();
  }

  Future<Product?> findByBarcode(String barcode) {
    return _products.findByBarcode(barcode);
  }

  Future<ProductCategory> getOrCreateCategory(String name) {
    return _categories.getOrCreate(name);
  }

  /// Crea un nuovo prodotto. Se [localPhotoPath] è passato (foto appena
  /// scattata/selezionata), viene prima copiata nello storage permanente
  /// dell'app.
  Future<Product> createProduct({
    required String name,
    String? barcode,
    int? categoryId,
    String? localPhotoPath,
    int minThreshold = 0,
    int initialQuantity = 0,
  }) async {
    String? storedPhotoPath;
    if (localPhotoPath != null) {
      storedPhotoPath = await _photos.saveProductPhoto(localPhotoPath);
    }

    final now = DateTime.now();
    final created = await _products.create(Product(
      barcode: (barcode == null || barcode.trim().isEmpty) ? null : barcode.trim(),
      name: name.trim(),
      categoryId: categoryId,
      photoPath: storedPhotoPath,
      quantity: initialQuantity,
      minThreshold: minThreshold,
      createdAt: now,
      updatedAt: now,
    ));

    await refreshProducts();
    return created;
  }

  Future<void> updateProduct(
    Product existing, {
    required String name,
    String? barcode,
    int? categoryId,
    String? newLocalPhotoPath,
    required int minThreshold,
  }) async {
    String? photoPath = existing.photoPath;
    if (newLocalPhotoPath != null) {
      await _photos.deletePhoto(existing.photoPath);
      photoPath = await _photos.saveProductPhoto(newLocalPhotoPath);
    }

    await _products.update(existing.copyWith(
      name: name.trim(),
      barcode: (barcode == null || barcode.trim().isEmpty) ? null : barcode.trim(),
      categoryId: categoryId,
      photoPath: photoPath,
      minThreshold: minThreshold,
      updatedAt: DateTime.now(),
    ));

    await refreshProducts();
  }

  Future<void> deleteProduct(Product product) async {
    await _photos.deletePhoto(product.photoPath);
    await _products.delete(product.id!);
    await refreshProducts();
    await refreshHistory();
  }

  /// Registra un'entrata/uscita per [product] e, se la giacenza risultante
  /// scende sotto la soglia minima, invia l'avviso locale corrispondente.
  Future<void> registerMovement({
    required Product product,
    required MovementType type,
    required int quantity,
    String? note,
  }) async {
    final result = await _movements.register(
      product: product,
      type: type,
      quantity: quantity,
      note: (note == null || note.trim().isEmpty) ? null : note.trim(),
    );

    if (result.shouldNotifyLowStock) {
      // Il movimento è già scritto in transazione: un fallimento della
      // notifica (permesso negato, servizio di sistema non disponibile...)
      // non deve mai bloccare il resto del flusso né restare silente per
      // l'utente in un secondo momento.
      try {
        await _notifications.notifyLowStock(result.updatedProduct);
      } catch (error) {
        debugPrint('Notifica scorta bassa non inviata: $error');
      }
    }

    await refreshProducts();
    await refreshHistory();
  }

  /// Annulla un movimento registrato per errore, riportando la giacenza a
  /// come era prima. Non genera una nuova notifica di scorta bassa.
  Future<void> undoMovement(Movement movement) async {
    await _movements.undo(movement);
    await refreshProducts();
    await refreshHistory();
  }

  /// Rettifica la giacenza al valore contato fisicamente durante un
  /// inventario, generando automaticamente il movimento IN/OUT necessario
  /// a colmare la differenza. Se il conteggio coincide con la giacenza
  /// registrata non fa nulla.
  Future<void> adjustStock(Product product, int countedQuantity) async {
    final current = await _products.getById(product.id!) ?? product;
    final diff = countedQuantity - current.quantity;
    if (diff == 0) return;

    await registerMovement(
      product: current,
      type: diff > 0 ? MovementType.inbound : MovementType.outbound,
      quantity: diff.abs(),
      note: 'Rettifica inventario',
    );
  }
}
