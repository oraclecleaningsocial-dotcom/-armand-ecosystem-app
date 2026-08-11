import 'dart:convert';
import 'dart:io';

import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/movement.dart';
import '../models/product.dart';

/// Genera file CSV (anagrafica prodotti / storico movimenti) e li condivide
/// tramite il pannello di condivisione nativo, per esportarli via email,
/// spazio cloud, chiavetta, ecc. La generazione del file è puramente
/// locale: la condivisione è l'unico passaggio che può opzionalmente usare
/// la rete, a seconda della app scelta dall'utente per riceverlo.
class ExportService {
  Future<void> shareProducts(List<Product> products) async {
    final buffer = StringBuffer()
      ..writeln(_row(['Nome', 'Codice a barre', 'Categoria', 'Giacenza', 'Soglia minima']));

    for (final product in products) {
      buffer.writeln(_row([
        product.name,
        product.barcode ?? '',
        product.categoryName ?? '',
        '${product.quantity}',
        '${product.minThreshold}',
      ]));
    }

    await _shareCsv(buffer.toString(), 'inventario');
  }

  Future<void> shareMovements(List<Movement> movements) async {
    final buffer = StringBuffer()
      ..writeln(_row(['Data e ora', 'Prodotto', 'Tipo', 'Quantità', 'Nota']));

    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    for (final movement in movements) {
      buffer.writeln(_row([
        dateFormat.format(movement.createdAt),
        movement.productName ?? '',
        movement.type == MovementType.inbound ? 'Entrata' : 'Uscita',
        '${movement.quantity}',
        movement.note ?? '',
      ]));
    }

    await _shareCsv(buffer.toString(), 'storico_movimenti');
  }

  Future<void> _shareCsv(String content, String baseName) async {
    final dir = await getTemporaryDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final file = File(p.join(dir.path, '${baseName}_$timestamp.csv'));

    // BOM UTF-8 così Excel apre correttamente gli accenti italiani.
    await file.writeAsBytes([0xEF, 0xBB, 0xBF, ...utf8.encode(content)]);

    await SharePlus.instance.share(
      ShareParams(files: [XFile(file.path)], fileNameOverrides: ['${baseName}_$timestamp.csv']),
    );
  }

  String _row(List<String> fields) => fields.map(_escapeField).join(',');

  String _escapeField(String field) {
    final needsQuoting = field.contains(',') || field.contains('"') || field.contains('\n');
    final escaped = field.replaceAll('"', '""');
    return needsQuoting ? '"$escaped"' : escaped;
  }
}
