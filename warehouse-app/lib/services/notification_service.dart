import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../models/product.dart';

/// Notifiche locali (nessun server coinvolto): funzionano anche senza
/// connessione di rete, requisito fondamentale per l'uso in magazzino.
class NotificationService {
  NotificationService._internal();

  static final NotificationService instance = NotificationService._internal();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  static const AndroidNotificationDetails _androidDetails =
      AndroidNotificationDetails(
    'low_stock_channel',
    'Scorte basse',
    channelDescription: 'Avviso quando la giacenza di un articolo scende sotto la soglia minima',
    importance: Importance.high,
    priority: Priority.high,
  );

  Future<void> init() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(settings);
    _initialized = true;
  }

  Future<void> notifyLowStock(Product product) async {
    await init();

    const details = NotificationDetails(
      android: _androidDetails,
      iOS: DarwinNotificationDetails(),
    );

    await _plugin.show(
      // L'id della notifica coincide con l'id prodotto: un secondo avviso
      // per lo stesso articolo sostituisce quello precedente invece di
      // accumularsi nel pannello notifiche.
      product.id ?? 0,
      'Scorta bassa: ${product.name}',
      'Giacenza attuale: ${product.quantity} (soglia minima: ${product.minThreshold})',
      details,
    );
  }
}
