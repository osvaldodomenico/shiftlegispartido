import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/notifications/fcm_provider.dart';

enum AuthStatus { idle, loading, success, error }

class AuthState {
  final AuthStatus status;
  final String? errorMessage;

  const AuthState({this.status = AuthStatus.idle, this.errorMessage});

  AuthState copyWith({AuthStatus? status, String? errorMessage}) {
    return AuthState(
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final Ref _ref;

  AuthNotifier(this._authService, this._ref) : super(const AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      await _authService.login(email, password);
      // Invalida provider de isLoggedIn para o router redirecionar automaticamente
      _ref.invalidate(isLoggedInProvider);
      state = state.copyWith(status: AuthStatus.success);
      // Registra token FCM no backend após login bem-sucedido
      await _ref.read(fcmServiceProvider).registerToken();
    } on ApiException catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: e.message);
    } catch (_) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Falha ao conectar. Tente novamente.',
      );
    }
  }

  Future<void> logout() async {
    // Remove token FCM do backend antes de apagar credenciais locais
    await _ref.read(fcmServiceProvider).unregisterToken();
    await _authService.logout();
    _ref.invalidate(isLoggedInProvider);
    state = const AuthState();
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider), ref);
});
