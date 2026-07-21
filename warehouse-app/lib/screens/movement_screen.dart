import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/movement.dart';
import '../models/product.dart';
import '../state/inventory_provider.dart';
import '../widgets/stock_badge.dart';

/// Registra un'entrata o un'uscita per il prodotto già identificato
/// (tramite scansione o selezione manuale dall'elenco).
class MovementScreen extends StatefulWidget {
  final Product product;

  const MovementScreen({super.key, required this.product});

  @override
  State<MovementScreen> createState() => _MovementScreenState();
}

class _MovementScreenState extends State<MovementScreen> {
  MovementType _type = MovementType.inbound;
  int _quantity = 1;
  final _noteController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    setState(() => _saving = true);

    final provider = context.read<InventoryProvider>();
    await provider.registerMovement(
      product: widget.product,
      type: _type,
      quantity: _quantity,
      note: _noteController.text,
    );

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _type == MovementType.inbound
              ? 'Entrata registrata: +$_quantity ${widget.product.name}'
              : 'Uscita registrata: -$_quantity ${widget.product.name}',
        ),
      ),
    );

    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;

    return Scaffold(
      appBar: AppBar(title: const Text('Registra movimento')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (product.photoPath != null && File(product.photoPath!).existsSync())
                      CircleAvatar(radius: 32, backgroundImage: FileImage(File(product.photoPath!)))
                    else
                      const CircleAvatar(radius: 32, child: Icon(Icons.inventory_2_outlined)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(product.name, style: Theme.of(context).textTheme.titleMedium),
                          if (product.categoryName != null) Text(product.categoryName!),
                          const SizedBox(height: 6),
                          StockBadge(quantity: product.quantity, minThreshold: product.minThreshold),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _TypeButton(
                    label: 'Entrata',
                    icon: Icons.arrow_downward,
                    color: Colors.green,
                    selected: _type == MovementType.inbound,
                    onTap: () => setState(() => _type = MovementType.inbound),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _TypeButton(
                    label: 'Uscita',
                    icon: Icons.arrow_upward,
                    color: Colors.red,
                    selected: _type == MovementType.outbound,
                    onTap: () => setState(() => _type = MovementType.outbound),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text('Quantità', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(
                  iconSize: 32,
                  onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                  icon: const Icon(Icons.remove),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text('$_quantity', style: Theme.of(context).textTheme.headlineMedium),
                ),
                IconButton.filledTonal(
                  iconSize: 32,
                  onPressed: () => setState(() => _quantity++),
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Nota (opzionale)'),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _saving ? null : _confirm,
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Conferma'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _TypeButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.15) : Theme.of(context).cardColor,
          border: Border.all(color: selected ? color : Colors.grey.shade300, width: 2),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
