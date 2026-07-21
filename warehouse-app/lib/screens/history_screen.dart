import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/movement.dart';
import '../state/inventory_provider.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  int? _selectedProductId;

  @override
  void dispose() {
    // Ripristina lo storico completo (non filtrato) per la Home.
    context.read<InventoryProvider>().refreshHistory();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InventoryProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Storico movimenti')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            DropdownButtonFormField<int?>(
              initialValue: _selectedProductId,
              decoration: const InputDecoration(labelText: 'Filtra per prodotto'),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('Tutti i prodotti')),
                ...provider.productList.map(
                  (p) => DropdownMenuItem<int?>(value: p.id, child: Text(p.name)),
                ),
              ],
              onChanged: (value) {
                setState(() => _selectedProductId = value);
                provider.refreshHistory(productId: value);
              },
            ),
            const SizedBox(height: 12),
            Expanded(
              child: provider.recentMovements.isEmpty
                  ? const Center(child: Text('Nessun movimento registrato.'))
                  : ListView.separated(
                      itemCount: provider.recentMovements.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 4),
                      itemBuilder: (context, index) =>
                          _MovementRow(movement: provider.recentMovements[index]),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MovementRow extends StatelessWidget {
  final Movement movement;

  const _MovementRow({required this.movement});

  @override
  Widget build(BuildContext context) {
    final isIn = movement.type == MovementType.inbound;
    final color = isIn ? Colors.green : Colors.red;

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.15),
          child: Icon(isIn ? Icons.arrow_downward : Icons.arrow_upward, color: color),
        ),
        title: Text(movement.productName ?? 'Prodotto'),
        subtitle: Text(
          DateFormat('EEEE dd MMMM yyyy, HH:mm', 'it_IT').format(movement.createdAt) +
              (movement.note != null ? '\n${movement.note}' : ''),
        ),
        isThreeLine: movement.note != null,
        trailing: Text(
          '${isIn ? '+' : '-'}${movement.quantity}',
          style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }
}
