class Product {
  final int? id;
  final String? barcode;
  final String name;
  final int? categoryId;
  final String? categoryName;
  final String? photoPath;
  final int quantity;
  final int minThreshold;
  final bool lowStockNotified;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Product({
    this.id,
    this.barcode,
    required this.name,
    this.categoryId,
    this.categoryName,
    this.photoPath,
    this.quantity = 0,
    this.minThreshold = 0,
    this.lowStockNotified = false,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isLowStock => quantity <= minThreshold;

  factory Product.fromMap(Map<String, Object?> map) {
    return Product(
      id: map['id'] as int?,
      barcode: map['barcode'] as String?,
      name: map['name'] as String,
      categoryId: map['category_id'] as int?,
      categoryName: map['category_name'] as String?,
      photoPath: map['photo_path'] as String?,
      quantity: map['quantity'] as int? ?? 0,
      minThreshold: map['min_threshold'] as int? ?? 0,
      lowStockNotified: (map['low_stock_notified'] as int? ?? 0) == 1,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  Map<String, Object?> toMap() {
    return {
      if (id != null) 'id': id,
      'barcode': barcode,
      'name': name,
      'category_id': categoryId,
      'photo_path': photoPath,
      'quantity': quantity,
      'min_threshold': minThreshold,
      'low_stock_notified': lowStockNotified ? 1 : 0,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Product copyWith({
    int? id,
    String? barcode,
    String? name,
    int? categoryId,
    String? categoryName,
    String? photoPath,
    int? quantity,
    int? minThreshold,
    bool? lowStockNotified,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      barcode: barcode ?? this.barcode,
      name: name ?? this.name,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName ?? this.categoryName,
      photoPath: photoPath ?? this.photoPath,
      quantity: quantity ?? this.quantity,
      minThreshold: minThreshold ?? this.minThreshold,
      lowStockNotified: lowStockNotified ?? this.lowStockNotified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
