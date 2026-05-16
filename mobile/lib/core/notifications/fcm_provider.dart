import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/auth_provider.dart';
import '../api/dio_client.dart';
import 'fcm_service.dart';

// NavigatorKey global — compartilhado entre main.dart e FcmService
final navigatorKey = GlobalKey<NavigatorState>();

final fcmServiceProvider = Provider<FcmService>((ref) {
  final authService = ref.watch(authServiceProvider);
  final dio = DioClient.getInstance(authService);
  return FcmService(dio: dio, navigatorKey: navigatorKey);
});
