import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Copia le foto scattate/scelte nella sandbox locale dell'app, così restano
/// disponibili offline e non dipendono dal percorso temporaneo restituito
/// da image_picker (che può essere ripulito dal sistema operativo).
class PhotoStorageService {
  Future<String> saveProductPhoto(String sourcePath) async {
    final appDir = await getApplicationDocumentsDirectory();
    final productsDir = Directory(p.join(appDir.path, 'product_photos'));
    if (!await productsDir.exists()) {
      await productsDir.create(recursive: true);
    }

    final fileName = '${DateTime.now().microsecondsSinceEpoch}${p.extension(sourcePath)}';
    final destinationPath = p.join(productsDir.path, fileName);

    await File(sourcePath).copy(destinationPath);
    return destinationPath;
  }

  Future<void> deletePhoto(String? path) async {
    if (path == null) return;
    final file = File(path);
    if (await file.exists()) {
      await file.delete();
    }
  }
}
