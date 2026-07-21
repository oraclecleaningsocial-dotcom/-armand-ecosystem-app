import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'screens/home_screen.dart';
import 'state/inventory_provider.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Necessario perché lo storico usa nomi di giorno/mese in italiano
  // (DateFormat con simboli testuali richiede i dati di localizzazione).
  await initializeDateFormatting('it_IT');
  runApp(const WarehouseApp());
}

class WarehouseApp extends StatelessWidget {
  const WarehouseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => InventoryProvider()..init(),
      child: MaterialApp(
        title: 'Magazzino',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        locale: const Locale('it', 'IT'),
        home: const HomeScreen(),
      ),
    );
  }
}
