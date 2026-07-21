import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/movement.dart';
import '../state/inventory_provider.dart';
import '../widgets/product_card.dart';
import 'history_screen.dart';
import 'product_list_screen.dart';
import 'scan_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InventoryProvider>();

    if (provider.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Magazzino')),
      body: RefreshIndicator(
        onRefresh: () async {
          await provider.refreshProducts();
          await provider.refreshHistory();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ScanButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ScanScreen()),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.inventory_2_outlined),
                    label: const Text('Prodotti'),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProductListScreen()),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.history),
                    label: const Text('Storico'),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const HistoryScreen()),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _SectionTitle(
              title: 'Scorte basse',
              trailing: provider.lowStockList.isEmpty
                  ? null
                  : '${provider.lowStockList.length}',
            ),
            if (provider.lowStockList.isEmpty)
              const _EmptyHint(text: 'Nessun articolo sotto la soglia minima.')
            else
              ...provider.lowStockList.map(
                (product) => ProductCard(product: product),
              ),
            const SizedBox(height: 24),
            const _SectionTitle(title: 'Ultimi movimenti'),
            if (provider.recentMovements.isEmpty)
              const _EmptyHint(text: 'Nessun movimento registrato ancora.')
            else
              ...provider.recentMovements.take(10).map(
                    (movement) => _MovementTile(movement: movement),
                  ),
          ],
        ),
      ),
    );
  }
}

class _ScanButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _ScanButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: const Icon(Icons.qr_code_scanner, size: 28),
      label: const Text('Scansiona articolo'),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? trailing;

  const _SectionTitle({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          if (trailing != null)
            CircleAvatar(radius: 12, child: Text(trailing!, style: const TextStyle(fontSize: 12))),
        ],
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  final String text;

  const _EmptyHint({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(text, style: TextStyle(color: Theme.of(context).colorScheme.outline)),
    );
  }
}

class _MovementTile extends StatelessWidget {
  final Movement movement;

  const _MovementTile({required this.movement});

  @override
  Widget build(BuildContext context) {
    final isIn = movement.type == MovementType.inbound;
    final dateLabel = DateFormat('dd/MM/yyyy HH:mm').format(movement.createdAt);

    return Card(
      child: ListTile(
        leading: Icon(
          isIn ? Icons.arrow_downward : Icons.arrow_upward,
          color: isIn ? Colors.green : Colors.red,
        ),
        title: Text(movement.productName ?? 'Prodotto'),
        subtitle: Text(dateLabel),
        trailing: Text(
          '${isIn ? '+' : '-'}${movement.quantity}',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isIn ? Colors.green : Colors.red,
          ),
        ),
      ),
    );
  }
}
