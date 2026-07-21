import 'dart:io';

import 'package:flutter/material.dart';

import '../models/product.dart';
import 'stock_badge.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductCard({super.key, required this.product, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        onTap: onTap,
        leading: _Thumbnail(photoPath: product.photoPath, name: product.name),
        title: Text(product.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text([
          if (product.categoryName != null) product.categoryName!,
          if (product.barcode != null) product.barcode!,
        ].join(' · ')),
        trailing: StockBadge(
          quantity: product.quantity,
          minThreshold: product.minThreshold,
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  final String? photoPath;
  final String name;

  const _Thumbnail({required this.photoPath, required this.name});

  @override
  Widget build(BuildContext context) {
    if (photoPath != null && File(photoPath!).existsSync()) {
      return CircleAvatar(
        radius: 24,
        backgroundImage: FileImage(File(photoPath!)),
      );
    }

    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return CircleAvatar(
      radius: 24,
      child: Text(initial, style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }
}
