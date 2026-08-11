/// Chiamata `ProductCategory` (non `Category`) perché quel nome collide con
/// l'annotazione `Category` esportata da `package:flutter/foundation.dart`.
class ProductCategory {
  final int? id;
  final String name;

  const ProductCategory({this.id, required this.name});

  factory ProductCategory.fromMap(Map<String, Object?> map) {
    return ProductCategory(
      id: map['id'] as int?,
      name: map['name'] as String,
    );
  }

  Map<String, Object?> toMap() {
    return {
      if (id != null) 'id': id,
      'name': name,
    };
  }
}
