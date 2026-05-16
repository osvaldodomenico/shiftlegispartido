import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

// Handler de background — deve ser função top-level (fora de qualquer classe)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Processamento mínimo em background — apenas log
  debugPrint('Background FCM: ${message.messageId}');
}

class FcmService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final Dio _dio;
  final GlobalKey<NavigatorState> navigatorKey;

  FcmService({required Dio dio, required this.navigatorKey}) : _dio = dio;

  Future<void> initialize() async {
    // Solicita permissão (iOS requer explicitamente; Android 13+ também)
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Handler de mensagens em background (deve ser registrado no main antes de runApp)
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Foreground messages — exibe SnackBar com botão "Ver"
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Tap em notificação com app fechado (cold start)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      // Pequeno delay para garantir que o router esteja pronto
      await Future.delayed(const Duration(milliseconds: 500));
      _handleMessageTap(initialMessage);
    }

    // Tap em notificação com app em background (warm start)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);
  }

  /// Registra o token FCM no backend após login
  Future<void> registerToken() async {
    try {
      final token = await _messaging.getToken();
      if (token == null) return;

      await _dio.post('/crm/device-tokens', data: {
        'token': token,
        'platform': _platform(),
      });

      // Atualiza token quando o FCM renova
      _messaging.onTokenRefresh.listen((newToken) async {
        try {
          await _dio.post('/crm/device-tokens', data: {
            'token': newToken,
            'platform': _platform(),
          });
        } catch (e) {
          debugPrint('FCM token refresh registration failed: $e');
        }
      });
    } catch (e) {
      // Não bloqueia o login se o registro de token falhar
      debugPrint('FCM registerToken failed: $e');
    }
  }

  /// Remove token FCM no backend ao fazer logout
  Future<void> unregisterToken() async {
    try {
      final token = await _messaging.getToken();
      if (token == null) return;
      await _dio.delete('/crm/device-tokens', data: {'token': token});
    } catch (e) {
      debugPrint('FCM unregisterToken failed: $e');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final context = navigatorKey.currentContext;
    if (context == null) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message.notification?.title ?? 'Nova notificação'),
        action: SnackBarAction(
          label: 'Ver',
          onPressed: () => _handleMessageTap(message),
        ),
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _handleMessageTap(RemoteMessage message) {
    final data = message.data;
    final entityType = data['entity_type'];
    final entityId = data['entity_id'];

    final context = navigatorKey.currentContext;
    if (context == null) return;
    final router = GoRouter.of(context);

    switch (entityType) {
      case 'person':
        if (entityId != null) {
          router.push('/contacts/$entityId');
        } else {
          router.push('/contacts');
        }
      case 'task':
        router.push('/tasks');
      case 'campaign':
        if (entityId != null) {
          router.push('/campaigns/$entityId');
        } else {
          router.push('/campaigns');
        }
      default:
        router.push('/notifications');
    }
  }

  String _platform() {
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'ios';
    return 'android';
  }
}
