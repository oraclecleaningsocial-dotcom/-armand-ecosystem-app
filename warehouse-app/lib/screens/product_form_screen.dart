import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../models/product.dart';
import '../state/inventory_provider.dart';

/// Crea un nuovo prodotto oppure modifica uno esistente (se [product] è
/// passato). Usata sia dal flusso "codice non riconosciuto" durante la
/// scansione, sia dall'elenco prodotti per l'inserimento manuale.
class ProductFormScreen extends StatefulWidget {
  final Product? product;
  final String? initialBarcode;

  const ProductFormScreen({super.key, this.product, this.initialBarcode});

  bool get isEditing => product != null;

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _barcodeController;
  late final TextEditingController _thresholdController;
  late final TextEditingController _quantityController;

  int? _categoryId;
  String? _newLocalPhotoPath;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final product = widget.product;
    _nameController = TextEditingController(text: product?.name ?? '');
    _barcodeController = TextEditingController(text: product?.barcode ?? widget.initialBarcode ?? '');
    _thresholdController = TextEditingController(text: '${product?.minThreshold ?? 0}');
    _quantityController = TextEditingController(text: '${product?.quantity ?? 0}');
    _categoryId = product?.categoryId;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _barcodeController.dispose();
    _thresholdController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source, maxWidth: 1024, imageQuality: 85);
    if (file != null) {
      setState(() => _newLocalPhotoPath = file.path);
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('Scatta foto'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Scegli dalla galleria'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _promptNewCategory(InventoryProvider provider) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuova categoria'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annulla')),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Crea'),
          ),
        ],
      ),
    );

    if (name != null && name.trim().isNotEmpty) {
      final category = await provider.getOrCreateCategory(name);
      await provider.refreshCategories();
      setState(() => _categoryId = category.id);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final provider = context.read<InventoryProvider>();
    final threshold = int.tryParse(_thresholdController.text) ?? 0;

    if (widget.isEditing) {
      await provider.updateProduct(
        widget.product!,
        name: _nameController.text,
        barcode: _barcodeController.text,
        categoryId: _categoryId,
        newLocalPhotoPath: _newLocalPhotoPath,
        minThreshold: threshold,
      );
    } else {
      await provider.createProduct(
        name: _nameController.text,
        barcode: _barcodeController.text,
        categoryId: _categoryId,
        localPhotoPath: _newLocalPhotoPath,
        minThreshold: threshold,
        initialQuantity: int.tryParse(_quantityController.text) ?? 0,
      );
    }

    if (!mounted) return;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InventoryProvider>();

    return Scaffold(
      appBar: AppBar(title: Text(widget.isEditing ? 'Modifica prodotto' : 'Nuovo prodotto')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: GestureDetector(
                  onTap: _showPhotoOptions,
                  child: _PhotoPreview(
                    localPath: _newLocalPhotoPath,
                    existingPath: widget.product?.photoPath,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Nome prodotto'),
                validator: (value) =>
                    (value == null || value.trim().isEmpty) ? 'Inserisci un nome' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _barcodeController,
                decoration: const InputDecoration(labelText: 'Codice a barre / QR (opzionale)'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<int?>(
                value: _categoryId,
                decoration: const InputDecoration(labelText: 'Categoria'),
                items: [
                  const DropdownMenuItem<int?>(value: null, child: Text('Nessuna categoria')),
                  ...provider.categoryList.map(
                    (Category c) => DropdownMenuItem<int?>(value: c.id, child: Text(c.name)),
                  ),
                ],
                onChanged: (value) => setState(() => _categoryId = value),
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => _promptNewCategory(provider),
                  icon: const Icon(Icons.add),
                  label: const Text('Nuova categoria'),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _thresholdController,
                decoration: const InputDecoration(labelText: 'Soglia minima scorta'),
                keyboardType: TextInputType.number,
              ),
              if (!widget.isEditing) ...[
                const SizedBox(height: 16),
                TextFormField(
                  controller: _quantityController,
                  decoration: const InputDecoration(labelText: 'Giacenza iniziale'),
                  keyboardType: TextInputType.number,
                ),
              ],
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Salva'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PhotoPreview extends StatelessWidget {
  final String? localPath;
  final String? existingPath;

  const _PhotoPreview({required this.localPath, required this.existingPath});

  @override
  Widget build(BuildContext context) {
    ImageProvider? image;
    if (localPath != null) {
      image = FileImage(File(localPath!));
    } else if (existingPath != null && File(existingPath!).existsSync()) {
      image = FileImage(File(existingPath!));
    }

    return CircleAvatar(
      radius: 48,
      backgroundImage: image,
      child: image == null ? const Icon(Icons.add_a_photo_outlined, size: 32) : null,
    );
  }
}
