import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../state/inventory_provider.dart';
import 'movement_screen.dart';
import 'product_form_screen.dart';

/// Schermata fotocamera per la lettura di barcode/QR. Il riconoscimento
/// avviene interamente sul dispositivo (ML Kit / Vision): nessuna rete
/// coinvolta, funziona anche senza connessione.
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handled) return;

    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null || code.isEmpty) return;

    _handled = true;
    await _controller.stop();

    if (!mounted) return;

    final provider = context.read<InventoryProvider>();
    final product = await provider.findByBarcode(code);

    if (!mounted) return;

    if (product != null) {
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => MovementScreen(product: product)),
      );
    } else {
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ProductFormScreen(initialBarcode: code)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scansiona'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        alignment: Alignment.center,
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          Container(
            width: 260,
            height: 160,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 3),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          Positioned(
            bottom: 32,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Inquadra il codice a barre o QR',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
