import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccessToken = 'access_token';
const _kRefreshToken = 'refresh_token';
// URL base do backend NestJS — ajuste via variável de ambiente ou flavors
const _kBaseUrl = 'http://localhost:3000/api/v1';

class AuthService {
  final FlutterSecureStorage _storage;
  final Dio _rawDio; // Dio sem interceptor (para evitar loop no refresh)

  AuthService()
      : _storage = const FlutterSecureStorage(),
        _rawDio = Dio(BaseOptions(baseUrl: _kBaseUrl));

  Future<String?> getAccessToken() => _storage.read(key: _kAccessToken);
  Future<String?> getRefreshToken() => _storage.read(key: _kRefreshToken);

  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null;
  }

  /// POST /auth/login
  Future<void> login(String email, String password) async {
    final response = await _rawDio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = response.data['data'];
    await _storage.write(key: _kAccessToken, value: data['access_token']);
    await _storage.write(key: _kRefreshToken, value: data['refresh_token']);
  }

  /// POST /auth/refresh
  Future<String?> refreshToken() async {
    final storedRefresh = await getRefreshToken();
    if (storedRefresh == null) return null;

    final response = await _rawDio.post('/auth/refresh', data: {
      'refresh_token': storedRefresh,
    });
    final data = response.data['data'];
    final newAccessToken = data['access_token'] as String;
    await _storage.write(key: _kAccessToken, value: newAccessToken);
    // Se a API retornar novo refresh_token, atualiza também
    if (data['refresh_token'] != null) {
      await _storage.write(key: _kRefreshToken, value: data['refresh_token']);
    }
    return newAccessToken;
  }

  Future<void> logout() async {
    await _storage.delete(key: _kAccessToken);
    await _storage.delete(key: _kRefreshToken);
  }
}
