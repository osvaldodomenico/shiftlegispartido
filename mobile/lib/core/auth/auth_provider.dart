import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../api/dio_client.dart';
import 'auth_service.dart';

/// Provedor singleton do AuthService
final authServiceProvider = Provider<AuthService>((ref) => AuthService());

/// Provedor singleton do Dio configurado com interceptores JWT
final dioProvider = Provider<Dio>((ref) {
  final authService = ref.watch(authServiceProvider);
  return DioClient.getInstance(authService);
});

/// Estado reativo de login — true se o usuário possui access_token válido
final isLoggedInProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(authServiceProvider);
  return service.isLoggedIn();
});
