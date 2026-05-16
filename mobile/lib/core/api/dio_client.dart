import 'package:dio/dio.dart';
import '../auth/auth_service.dart';

// URL do backend NestJS — produção via flavors/env
const String kBaseUrl = 'http://localhost:3000/api/v1';

class DioClient {
  static Dio? _instance;
  static AuthService? _authService;

  static Dio getInstance(AuthService authService) {
    _authService = authService;
    _instance ??= _createDio();
    return _instance!;
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: kBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _authService!.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Tenta refresh automático do access token
            try {
              final newToken = await _authService!.refreshToken();
              if (newToken != null) {
                // Repete a requisição original com o novo token
                final opts = error.requestOptions;
                opts.headers['Authorization'] = 'Bearer $newToken';
                final response = await dio.fetch(opts);
                return handler.resolve(response);
              }
            } catch (_) {
              // Refresh falhou — força logout e limpa tokens
              await _authService!.logout();
            }
          }
          return handler.next(error);
        },
      ),
    );

    return dio;
  }

  /// Reseta a instância singleton (útil em testes e logout)
  static void reset() {
    _instance = null;
    _authService = null;
  }
}
