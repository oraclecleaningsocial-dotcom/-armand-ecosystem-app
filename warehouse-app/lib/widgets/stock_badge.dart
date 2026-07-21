import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Badge colorato con la giacenza: rosso se sotto/uguale alla soglia
/// minima, verde altrimenti. Un solo colpo d'occhio, nessun numero da
/// interpretare.
class StockBadge extends StatelessWidget {
  final int quantity;
  final int minThreshold;

  const StockBadge({
    super.key,
    required this.quantity,
    required this.minThreshold,
  });

  @override
  Widget build(BuildContext context) {
    final isLow = quantity <= minThreshold;
    final color = isLow ? AppTheme.danger : AppTheme.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isLow ? Icons.warning_amber_rounded : Icons.check_circle_outline,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            '$quantity',
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
