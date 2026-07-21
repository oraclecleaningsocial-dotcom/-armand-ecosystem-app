import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/product.dart';
import '../services/export_service.dart';
import '../state/inventory_provider.dart';
import '../widgets/product_card.dart';
import 'movement_screen.dart';
import 'product_form_screen.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final _searchController = TextEditingController();
  final _exportService = ExportService();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openActions(Product product) {
    showModalBottomSheet(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.swap_vert),
              title: const Text('Registra movimento'),
              onTap: () {
                Navigator.pop(sheetContext);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => MovementScreen(product: product)),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit_outlined),
              title: const Text('Modifica anagrafica'),
              onTap: () {
                Navigator.pop(sheetContext);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => ProductFormScreen(product: product)),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.fact_check_outlined),
              title: const Text('Rettifica giacenza (conta fisica)'),
              onTap: () {
                Navigator.pop(sheetContext);
                _promptAdjustStock(product);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: const Text('Elimina prodotto', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(sheetContext);
                _confirmAndDelete(product);
              },
            ),
          ],
        ),
      ),
    );
  }

  // Usa `context` dello State per lo stesso motivo di _confirmAndDelete.
  Future<void> _promptAdjustStock(Product product) async {
    final controller = TextEditingController(text: '${product.quantity}');

    final counted = await showDialog<int>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Giacenza contata per "${product.name}"'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Quantità effettiva in magazzino'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Annulla')),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, int.tryParse(controller.text)),
            child: const Text('Conferma'),
          ),
        ],
      ),
    );

    if (!mounted || counted == null || counted < 0) return;
    await context.read<InventoryProvider>().adjustStock(product, counted);
  }

  // Usa `context` dello State (stabile finché la schermata è aperta) invece
  // del context del bottom sheet, già chiuso da Navigator.pop sopra.
  Future<void> _confirmAndDelete(Product product) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Eliminare il prodotto?'),
        content: Text('Verrà eliminato anche lo storico movimenti di "${product.name}".'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Annulla')),
          TextButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Elimina')),
        ],
      ),
    );

    if (!mounted || confirmed != true) return;
    await context.read<InventoryProvider>().deleteProduct(product);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InventoryProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Prodotti'),
        actions: [
          IconButton(
            icon: const Icon(Icons.ios_share),
            tooltip: 'Esporta CSV',
            onPressed: provider.productList.isEmpty
                ? null
                : () => _exportService.shareProducts(provider.productList),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ProductFormScreen()),
        ),
        child: const Icon(Icons.add),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Cerca per nome o codice a barre',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => provider.refreshProducts(searchTerm: value),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: provider.productList.isEmpty
                  ? const Center(child: Text('Nessun prodotto trovato.'))
                  : ListView.builder(
                      itemCount: provider.productList.length,
                      itemBuilder: (context, index) {
                        final product = provider.productList[index];
                        return ProductCard(
                          product: product,
                          onTap: () => _openActions(product),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
