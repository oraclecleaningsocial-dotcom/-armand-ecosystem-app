enum MovementType {
  inbound,
  outbound;

  String get dbValue => this == MovementType.inbound ? 'IN' : 'OUT';

  static MovementType fromDbValue(String value) {
    return value == 'IN' ? MovementType.inbound : MovementType.outbound;
  }
}

class Movement {
  final int? id;
  final int productId;
  final String? productName;
  final MovementType type;
  final int quantity;
  final String? note;
  final DateTime createdAt;

  const Movement({
    this.id,
    required this.productId,
    this.productName,
    required this.type,
    required this.quantity,
    this.note,
    required this.createdAt,
  });

  factory Movement.fromMap(Map<String, Object?> map) {
    return Movement(
      id: map['id'] as int?,
      productId: map['product_id'] as int,
      productName: map['product_name'] as String?,
      type: MovementType.fromDbValue(map['type'] as String),
      quantity: map['quantity'] as int,
      note: map['note'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, Object?> toMap() {
    return {
      if (id != null) 'id': id,
      'product_id': productId,
      'type': type.dbValue,
      'quantity': quantity,
      'note': note,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
