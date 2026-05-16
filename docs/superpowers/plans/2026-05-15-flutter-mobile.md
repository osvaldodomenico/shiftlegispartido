# Flutter Mobile — ShiftPartido App

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ShiftPartido Flutter mobile app for iOS and Android with CRM field operations (contacts, interactions, tasks, pipeline), electoral campaign management, and push notifications.

**Architecture:** Clean architecture with feature-based folder structure. Riverpod for state management. Dio for HTTP with JWT interceptor. GoRouter for navigation with auth guard. Firebase Cloud Messaging for push notifications.

**Tech Stack:** Flutter 3.x, Dart, flutter_riverpod, dio, go_router, flutter_secure_storage, firebase_core, firebase_messaging, intl, cached_network_image, Material Design 3

**Prerequisite:** Backend Plan 1 (auth refresh endpoint) must be complete and API accessible.

---

## Chunk 1: Project Setup + Architecture

- [ ] Create Flutter project:
  ```bash
  flutter create shiftpartido_mobile --org br.org.shiftpartido
  cd shiftpartido_mobile
  ```

- [ ] Replace `pubspec.yaml` with the following complete file:
  ```yaml
  name: shiftpartido_mobile
  description: ShiftPartido — App de gestão partidária e CRM de campo.
  publish_to: 'none'
  version: 1.0.0+1

  environment:
    sdk: '>=3.3.0 <4.0.0'

  dependencies:
    flutter:
      sdk: flutter
    flutter_riverpod: ^2.5.0
    dio: ^5.4.0
    go_router: ^13.0.0
    flutter_secure_storage: ^9.0.0
    firebase_core: ^3.0.0
    firebase_messaging: ^15.0.0
    intl: ^0.19.0
    cached_network_image: ^3.3.0
    freezed_annotation: ^2.4.0
    json_annotation: ^4.9.0
    cupertino_icons: ^1.0.6

  dev_dependencies:
    flutter_test:
      sdk: flutter
    flutter_lints: ^3.0.0
    build_runner: ^2.4.0
    freezed: ^2.4.0
    json_serializable: ^6.7.0

  flutter:
    uses-material-design: true
  ```

- [ ] Run `flutter pub get`

- [ ] Create folder structure:
  ```bash
  mkdir -p lib/core/api
  mkdir -p lib/core/auth
  mkdir -p lib/core/router
  mkdir -p lib/core/theme
  mkdir -p lib/core/notifications
  mkdir -p lib/features/auth/screens
  mkdir -p lib/features/auth/providers
  mkdir -p lib/features/crm/models
  mkdir -p lib/features/crm/services
  mkdir -p lib/features/crm/providers
  mkdir -p lib/features/crm/screens
  mkdir -p lib/features/crm/widgets
  mkdir -p lib/features/electoral/models
  mkdir -p lib/features/electoral/services
  mkdir -p lib/features/electoral/providers
  mkdir -p lib/features/electoral/screens
  mkdir -p lib/features/electoral/widgets
  mkdir -p lib/features/party/screens
  mkdir -p lib/features/mandates/models
  mkdir -p lib/features/mandates/screens
  mkdir -p lib/features/home/screens
  mkdir -p lib/features/notifications/screens
  mkdir -p lib/features/notifications/providers
  mkdir -p lib/shared/widgets
  mkdir -p lib/shared/models
  ```

- [ ] Configure Android for `flutter_secure_storage` — in `android/app/src/main/AndroidManifest.xml` inside `<application>`:
  ```xml
  android:allowBackup="false"
  ```
  And set `minSdkVersion 21` in `android/app/build.gradle`.

- [ ] Configure iOS — in `ios/Runner/Info.plist` add:
  ```xml
  <key>NSFaceIDUsageDescription</key>
  <string>Autenticação segura</string>
  ```

- [ ] Set up Firebase:
  1. Create project at https://console.firebase.google.com
  2. Add Android app with package `br.org.shiftpartido.shiftpartido_mobile`
  3. Download `google-services.json` → place at `android/app/google-services.json`
  4. Add iOS app with bundle ID `br.org.shiftpartido.shiftpartido-mobile`
  5. Download `GoogleService-Info.plist` → place at `ios/Runner/GoogleService-Info.plist`
  6. In `android/build.gradle` add to `dependencies`: `classpath 'com.google.gms:google-services:4.4.0'`
  7. In `android/app/build.gradle` add at bottom: `apply plugin: 'com.google.gms.google-services'`

- [ ] Create `lib/core/theme/app_theme.dart`:
  ```dart
  import 'package:flutter/material.dart';

  class AppTheme {
    static const Color primary = Color(0xFF1565C0);
    static const Color secondary = Color(0xFF42A5F5);

    static ThemeData light() {
      return ThemeData(
        useMaterial3: true,
        colorSchemeSeed: primary,
        brightness: Brightness.light,
        appBarTheme: const AppBarTheme(centerTitle: false),
      );
    }

    static ThemeData dark() {
      return ThemeData(
        useMaterial3: true,
        colorSchemeSeed: primary,
        brightness: Brightness.dark,
        appBarTheme: const AppBarTheme(centerTitle: false),
      );
    }
  }
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: flutter project setup with folder structure and dependencies"
  ```

---

## Chunk 2: Core — API Layer + Auth

- [ ] Create `lib/core/api/api_exception.dart`:
  ```dart
  class ApiException implements Exception {
    final int? statusCode;
    final String message;
    final String? code;

    const ApiException({
      this.statusCode,
      required this.message,
      this.code,
    });

    factory ApiException.fromDioError(dynamic error) {
      if (error?.response != null) {
        final data = error.response.data;
        final message = data is Map ? (data['message'] ?? 'Erro desconhecido') : 'Erro desconhecido';
        final code = data is Map ? data['error']?['code'] : null;
        return ApiException(
          statusCode: error.response.statusCode,
          message: message.toString(),
          code: code?.toString(),
        );
      }
      return const ApiException(message: 'Sem conexão com o servidor');
    }

    @override
    String toString() => 'ApiException($statusCode): $message';
  }
  ```

- [ ] Create `lib/core/api/dio_client.dart`:
  ```dart
  import 'package:dio/dio.dart';
  import 'package:flutter_secure_storage/flutter_secure_storage.dart';
  import '../auth/auth_service.dart';
  import 'api_exception.dart';

  const String kBaseUrl = 'https://api.shiftpartido.org.br/v1';
  // Troque pela URL real do backend NestJS

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
              // Tenta refresh
              try {
                final newToken = await _authService!.refreshToken();
                if (newToken != null) {
                  // Repete a requisição original com novo token
                  final opts = error.requestOptions;
                  opts.headers['Authorization'] = 'Bearer $newToken';
                  final response = await dio.fetch(opts);
                  return handler.resolve(response);
                }
              } catch (_) {
                // Refresh falhou — força logout
                await _authService!.logout();
              }
            }
            return handler.next(error);
          },
        ),
      );

      return dio;
    }
  }
  ```

- [ ] Create `lib/core/auth/auth_service.dart`:
  ```dart
  import 'package:dio/dio.dart';
  import 'package:flutter_secure_storage/flutter_secure_storage.dart';

  const _kAccessToken = 'access_token';
  const _kRefreshToken = 'refresh_token';
  const _kBaseUrl = 'https://api.shiftpartido.org.br/v1';

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
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) return null;

      final response = await _rawDio.post('/auth/refresh', data: {
        'refresh_token': refreshToken,
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
  ```

- [ ] Create `lib/core/auth/auth_provider.dart`:
  ```dart
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'auth_service.dart';

  final authServiceProvider = Provider<AuthService>((ref) => AuthService());

  final isLoggedInProvider = FutureProvider<bool>((ref) async {
    final service = ref.watch(authServiceProvider);
    return service.isLoggedIn();
  });
  ```

- [ ] Create `lib/core/router/app_router.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:go_router/go_router.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../../core/auth/auth_provider.dart';
  import '../../features/auth/screens/login_screen.dart';
  import '../../features/home/screens/home_screen.dart';
  import '../../features/crm/screens/contacts_screen.dart';
  import '../../features/crm/screens/contact_detail_screen.dart';
  import '../../features/crm/screens/my_tasks_screen.dart';
  import '../../features/crm/screens/pipeline_screen.dart';
  import '../../features/crm/screens/add_interaction_screen.dart';
  import '../../features/crm/screens/add_task_screen.dart';
  import '../../features/electoral/screens/campaigns_screen.dart';
  import '../../features/electoral/screens/campaign_detail_screen.dart';
  import '../../features/notifications/screens/notifications_screen.dart';
  import '../../features/party/screens/chapters_screen.dart';
  import '../../features/party/screens/organs_screen.dart';
  import '../../features/mandates/screens/mandates_screen.dart';

  final routerProvider = Provider<GoRouter>((ref) {
    final authAsync = ref.watch(isLoggedInProvider);

    return GoRouter(
      initialLocation: '/home',
      redirect: (context, state) {
        final isLogged = authAsync.valueOrNull ?? false;
        final isLoginRoute = state.matchedLocation == '/login';
        if (!isLogged && !isLoginRoute) return '/login';
        if (isLogged && isLoginRoute) return '/home';
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/contacts', builder: (_, __) => const ContactsScreen()),
        GoRoute(
          path: '/contacts/:id',
          builder: (_, state) => ContactDetailScreen(personId: state.pathParameters['id']!),
        ),
        GoRoute(path: '/tasks', builder: (_, __) => const MyTasksScreen()),
        GoRoute(path: '/pipeline', builder: (_, __) => const PipelineScreen()),
        GoRoute(
          path: '/contacts/:id/add-interaction',
          builder: (_, state) => AddInteractionScreen(personId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/contacts/:id/add-task',
          builder: (_, state) => AddTaskScreen(personId: state.pathParameters['id']!),
        ),
        GoRoute(path: '/campaigns', builder: (_, __) => const CampaignsScreen()),
        GoRoute(
          path: '/campaigns/:id',
          builder: (_, state) => CampaignDetailScreen(campaignId: state.pathParameters['id']!),
        ),
        GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        GoRoute(path: '/chapters', builder: (_, __) => const ChaptersScreen()),
        GoRoute(path: '/organs', builder: (_, __) => const OrgansScreen()),
        GoRoute(path: '/mandates', builder: (_, __) => const MandatesScreen()),
      ],
    );
  });
  ```

- [ ] Update `lib/main.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:firebase_core/firebase_core.dart';
  import 'core/router/app_router.dart';
  import 'core/theme/app_theme.dart';

  void main() async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp();
    runApp(const ProviderScope(child: ShiftPartidoApp()));
  }

  class ShiftPartidoApp extends ConsumerWidget {
    const ShiftPartidoApp({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final router = ref.watch(routerProvider);
      return MaterialApp.router(
        title: 'ShiftPartido',
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      );
    }
  }
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: core API layer, auth service, DioClient with JWT interceptor, GoRouter"
  ```

---

## Chunk 3: Auth Feature — Login Screen

- [ ] Create `lib/features/auth/providers/auth_notifier.dart`:
  ```dart
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../../../core/auth/auth_service.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/api_exception.dart';

  enum AuthStatus { idle, loading, success, error }

  class AuthState {
    final AuthStatus status;
    final String? errorMessage;
    const AuthState({this.status = AuthStatus.idle, this.errorMessage});
    AuthState copyWith({AuthStatus? status, String? errorMessage}) =>
        AuthState(status: status ?? this.status, errorMessage: errorMessage ?? this.errorMessage);
  }

  class AuthNotifier extends StateNotifier<AuthState> {
    final AuthService _authService;
    final Ref _ref;

    AuthNotifier(this._authService, this._ref) : super(const AuthState());

    Future<void> login(String email, String password) async {
      state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
      try {
        await _authService.login(email, password);
        // Invalida provider de isLoggedIn para o router redirecionar
        _ref.invalidate(isLoggedInProvider);
        state = state.copyWith(status: AuthStatus.success);
      } on ApiException catch (e) {
        state = state.copyWith(status: AuthStatus.error, errorMessage: e.message);
      } catch (_) {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Falha ao conectar. Tente novamente.');
      }
    }

    Future<void> logout() async {
      await _authService.logout();
      _ref.invalidate(isLoggedInProvider);
      state = const AuthState();
    }
  }

  final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
    return AuthNotifier(ref.watch(authServiceProvider), ref);
  });
  ```

- [ ] Create `lib/features/auth/screens/login_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../providers/auth_notifier.dart';

  class LoginScreen extends ConsumerStatefulWidget {
    const LoginScreen({super.key});

    @override
    ConsumerState<LoginScreen> createState() => _LoginScreenState();
  }

  class _LoginScreenState extends ConsumerState<LoginScreen> {
    final _formKey = GlobalKey<FormState>();
    final _emailController = TextEditingController();
    final _passwordController = TextEditingController();
    bool _obscurePassword = true;

    @override
    void dispose() {
      _emailController.dispose();
      _passwordController.dispose();
      super.dispose();
    }

    Future<void> _submit() async {
      if (!_formKey.currentState!.validate()) return;
      await ref.read(authNotifierProvider.notifier).login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    }

    @override
    Widget build(BuildContext context) {
      final state = ref.watch(authNotifierProvider);
      final isLoading = state.status == AuthStatus.loading;

      ref.listen(authNotifierProvider, (_, next) {
        if (next.status == AuthStatus.error && next.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.errorMessage!),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      });

      return Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 48),
                    Text(
                      'ShiftPartido',
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Acesse sua conta',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 48),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'E-mail',
                        prefixIcon: Icon(Icons.email_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Informe o e-mail';
                        if (!v.contains('@')) return 'E-mail inválido';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Senha',
                        prefixIcon: const Icon(Icons.lock_outlined),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Informe a senha';
                        if (v.length < 6) return 'Senha muito curta';
                        return null;
                      },
                    ),
                    const SizedBox(height: 32),
                    FilledButton(
                      onPressed: isLoading ? null : _submit,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Entrar', style: TextStyle(fontSize: 16)),
                    ),
                    const SizedBox(height: 48),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }
  }
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: login screen with form validation, Riverpod state, loading/error handling"
  ```

---

## Chunk 4: CRM — Contacts Feature

- [ ] Create `lib/features/crm/models/tag.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  part 'tag.freezed.dart';
  part 'tag.g.dart';

  @freezed
  class Tag with _$Tag {
    const factory Tag({
      required String id,
      required String name,
      String? color,
    }) = _Tag;
    factory Tag.fromJson(Map<String, dynamic> json) => _$TagFromJson(json);
  }
  ```

- [ ] Create `lib/features/crm/models/person.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  import 'tag.dart';
  part 'person.freezed.dart';
  part 'person.g.dart';

  @freezed
  class Person with _$Person {
    const factory Person({
      required String id,
      required String name,
      String? email,
      String? phone,
      String? type,           // voter, member, leader, donor, volunteer
      String? stage,          // pipeline stage
      String? neighborhood,
      String? city,
      String? state,
      @Default([]) List<Tag> tags,
      @JsonKey(name: 'created_at') DateTime? createdAt,
      @JsonKey(name: 'updated_at') DateTime? updatedAt,
    }) = _Person;
    factory Person.fromJson(Map<String, dynamic> json) => _$PersonFromJson(json);
  }

  @freezed
  class PersonListResponse with _$PersonListResponse {
    const factory PersonListResponse({
      required List<Person> data,
      required int total,
      required int page,
      @JsonKey(name: 'per_page') required int perPage,
    }) = _PersonListResponse;
    factory PersonListResponse.fromJson(Map<String, dynamic> json) => _$PersonListResponseFromJson(json);
  }
  ```

- [ ] Create `lib/features/crm/models/interaction.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  part 'interaction.freezed.dart';
  part 'interaction.g.dart';

  @freezed
  class Interaction with _$Interaction {
    const factory Interaction({
      required String id,
      @JsonKey(name: 'person_id') required String personId,
      required String type,        // call, meeting, message, email, event, note
      required String direction,   // inbound, outbound
      required String summary,
      @JsonKey(name: 'occurred_at') required DateTime occurredAt,
      @JsonKey(name: 'created_by_name') String? createdByName,
    }) = _Interaction;
    factory Interaction.fromJson(Map<String, dynamic> json) => _$InteractionFromJson(json);
  }
  ```

- [ ] Create `lib/features/crm/models/task.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  part 'task.freezed.dart';
  part 'task.g.dart';

  @freezed
  class Task with _$Task {
    const factory Task({
      required String id,
      required String title,
      String? description,
      required String status,       // pending, in_progress, done, cancelled
      required String priority,     // low, medium, high, urgent
      @JsonKey(name: 'due_date') DateTime? dueDate,
      @JsonKey(name: 'person_id') String? personId,
      @JsonKey(name: 'person_name') String? personName,
      @JsonKey(name: 'assigned_to_name') String? assignedToName,
      @JsonKey(name: 'completed_at') DateTime? completedAt,
    }) = _Task;
    factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
  }
  ```

- [ ] Run code generation:
  ```bash
  dart run build_runner build --delete-conflicting-outputs
  ```

- [ ] Create `lib/features/crm/services/crm_service.dart`:
  ```dart
  import 'package:dio/dio.dart';
  import '../models/person.dart';
  import '../models/interaction.dart';
  import '../models/task.dart';
  import '../models/tag.dart';
  import '../../../core/api/api_exception.dart';

  class CrmService {
    final Dio _dio;
    CrmService(this._dio);

    // --- Persons ---
    Future<PersonListResponse> getPersons({
      int page = 1,
      int perPage = 20,
      String? search,
      String? type,
      String? stage,
    }) async {
      try {
        final response = await _dio.get('/crm/persons', queryParameters: {
          'page': page,
          'per_page': perPage,
          if (search != null && search.isNotEmpty) 'search': search,
          if (type != null) 'type': type,
          if (stage != null) 'stage': stage,
        });
        return PersonListResponse.fromJson(response.data['data']);
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<Person> getPerson(String id) async {
      try {
        final response = await _dio.get('/crm/persons/$id');
        return Person.fromJson(response.data['data']);
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    // --- Interactions ---
    Future<List<Interaction>> getInteractions(String personId) async {
      try {
        final response = await _dio.get('/crm/persons/$personId/interactions');
        final list = response.data['data'] as List;
        return list.map((e) => Interaction.fromJson(e)).toList();
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<Interaction> createInteraction(String personId, Map<String, dynamic> body) async {
      try {
        final response = await _dio.post('/crm/persons/$personId/interactions', data: body);
        return Interaction.fromJson(response.data['data']);
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    // --- Tasks ---
    Future<List<Task>> getTasks({String? personId, String? assignedToMe}) async {
      try {
        final response = await _dio.get('/crm/tasks', queryParameters: {
          if (personId != null) 'person_id': personId,
          if (assignedToMe != null) 'assigned_to_me': assignedToMe,
        });
        final list = response.data['data'] as List;
        return list.map((e) => Task.fromJson(e)).toList();
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<Task> createTask(Map<String, dynamic> body) async {
      try {
        final response = await _dio.post('/crm/tasks', data: body);
        return Task.fromJson(response.data['data']);
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<Task> updateTaskStatus(String taskId, String status) async {
      try {
        final response = await _dio.patch('/crm/tasks/$taskId', data: {'status': status});
        return Task.fromJson(response.data['data']);
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    // --- Tags ---
    Future<List<Tag>> getTags() async {
      try {
        final response = await _dio.get('/crm/tags');
        final list = response.data['data'] as List;
        return list.map((e) => Tag.fromJson(e)).toList();
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<void> addTagToPerson(String personId, String tagId) async {
      try {
        await _dio.post('/crm/persons/$personId/tags', data: {'tag_id': tagId});
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<void> removeTagFromPerson(String personId, String tagId) async {
      try {
        await _dio.delete('/crm/persons/$personId/tags/$tagId');
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    // --- Pipeline ---
    Future<List<Person>> getPipelineStage(String stage) async {
      try {
        final response = await _dio.get('/crm/persons', queryParameters: {'stage': stage, 'per_page': 100});
        final list = response.data['data']['data'] as List;
        return list.map((e) => Person.fromJson(e)).toList();
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<void> updatePersonStage(String personId, String stage) async {
      try {
        await _dio.patch('/crm/persons/$personId', data: {'stage': stage});
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }
  }
  ```

- [ ] Create `lib/features/crm/providers/contacts_provider.dart`:
  ```dart
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:dio/dio.dart';
  import '../services/crm_service.dart';
  import '../models/person.dart';
  import '../models/interaction.dart';
  import '../models/task.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/dio_client.dart';

  final crmServiceProvider = Provider<CrmService>((ref) {
    final authService = ref.watch(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    return CrmService(dio);
  });

  // --- Contacts list ---
  class ContactsFilter {
    final String search;
    final String? type;
    ContactsFilter({this.search = '', this.type});
  }

  final contactsFilterProvider = StateProvider<ContactsFilter>((ref) => ContactsFilter());

  final contactsProvider = FutureProvider<PersonListResponse>((ref) async {
    final service = ref.watch(crmServiceProvider);
    final filter = ref.watch(contactsFilterProvider);
    return service.getPersons(search: filter.search, type: filter.type);
  });

  // --- Single contact ---
  final contactDetailProvider = FutureProvider.family<Person, String>((ref, id) async {
    final service = ref.watch(crmServiceProvider);
    return service.getPerson(id);
  });

  // --- Interactions ---
  final interactionsProvider = FutureProvider.family<List<Interaction>, String>((ref, personId) async {
    final service = ref.watch(crmServiceProvider);
    return service.getInteractions(personId);
  });

  // --- Tasks per person ---
  final personTasksProvider = FutureProvider.family<List<Task>, String>((ref, personId) async {
    final service = ref.watch(crmServiceProvider);
    return service.getTasks(personId: personId);
  });

  // --- My tasks ---
  final myTasksProvider = FutureProvider<List<Task>>((ref) async {
    final service = ref.watch(crmServiceProvider);
    return service.getTasks(assignedToMe: 'true');
  });
  ```

- [ ] Create `lib/features/crm/widgets/contact_card.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import '../models/person.dart';

  class ContactCard extends StatelessWidget {
    final Person person;
    final VoidCallback? onTap;

    const ContactCard({super.key, required this.person, this.onTap});

    Color _typeColor(BuildContext context, String? type) {
      final cs = Theme.of(context).colorScheme;
      return switch (type) {
        'member' => cs.primary,
        'leader' => cs.tertiary,
        'donor' => Colors.green,
        'volunteer' => Colors.orange,
        _ => cs.secondary,
      };
    }

    @override
    Widget build(BuildContext context) {
      final initials = person.name.split(' ').take(2).map((w) => w.isNotEmpty ? w[0].toUpperCase() : '').join();
      return Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: _typeColor(context, person.type),
            child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          title: Text(person.name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text([
            if (person.city != null) person.city,
            if (person.neighborhood != null) person.neighborhood,
          ].join(', '), overflow: TextOverflow.ellipsis),
          trailing: person.type != null
              ? Chip(
                  label: Text(person.type!, style: const TextStyle(fontSize: 11)),
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                )
              : null,
          onTap: onTap,
        ),
      );
    }
  }
  ```

- [ ] Create `lib/features/crm/widgets/timeline_item.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:intl/intl.dart';
  import '../models/interaction.dart';
  import '../models/task.dart';

  class TimelineItem extends StatelessWidget {
    final Interaction? interaction;
    final Task? task;

    const TimelineItem.interaction({super.key, required Interaction this.interaction}) : task = null;
    const TimelineItem.task({super.key, required Task this.task}) : interaction = null;

    IconData _interactionIcon(String type) {
      return switch (type) {
        'call' => Icons.phone_outlined,
        'meeting' => Icons.people_outlined,
        'message' => Icons.message_outlined,
        'email' => Icons.email_outlined,
        'event' => Icons.event_outlined,
        _ => Icons.note_outlined,
      };
    }

    @override
    Widget build(BuildContext context) {
      final theme = Theme.of(context);
      if (interaction != null) {
        final i = interaction!;
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: theme.colorScheme.secondaryContainer,
            child: Icon(_interactionIcon(i.type), color: theme.colorScheme.onSecondaryContainer, size: 20),
          ),
          title: Text(i.summary, maxLines: 2, overflow: TextOverflow.ellipsis),
          subtitle: Text(
            '${i.type} · ${DateFormat('dd/MM/yyyy HH:mm').format(i.occurredAt)}',
            style: theme.textTheme.bodySmall,
          ),
          dense: true,
        );
      } else {
        final t = task!;
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: t.status == 'done'
                ? Colors.green.shade100
                : theme.colorScheme.errorContainer,
            child: Icon(
              t.status == 'done' ? Icons.check_circle_outline : Icons.task_outlined,
              color: t.status == 'done' ? Colors.green : theme.colorScheme.error,
              size: 20,
            ),
          ),
          title: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text(
            'Tarefa · ${t.priority}${t.dueDate != null ? ' · ${DateFormat('dd/MM').format(t.dueDate!)}' : ''}',
            style: theme.textTheme.bodySmall,
          ),
          dense: true,
        );
      }
    }
  }
  ```

- [ ] Create `lib/features/crm/screens/contacts_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import '../providers/contacts_provider.dart';
  import '../widgets/contact_card.dart';

  const _types = ['todos', 'voter', 'member', 'leader', 'donor', 'volunteer'];

  class ContactsScreen extends ConsumerWidget {
    const ContactsScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final contactsAsync = ref.watch(contactsProvider);
      final filter = ref.watch(contactsFilterProvider);

      return Scaffold(
        appBar: AppBar(
          title: const Text('Contatos'),
          actions: [
            IconButton(
              icon: const Icon(Icons.person_add_outlined),
              onPressed: () => context.push('/contacts/new'),
            ),
          ],
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Buscar por nome, cidade...',
                  prefixIcon: Icon(Icons.search),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                onChanged: (v) => ref.read(contactsFilterProvider.notifier).state =
                    ContactsFilter(search: v, type: filter.type == 'todos' ? null : filter.type),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 36,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _types.length,
                itemBuilder: (_, i) {
                  final t = _types[i];
                  final selected = (filter.type == null && t == 'todos') || filter.type == t;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(t),
                      selected: selected,
                      onSelected: (_) {
                        ref.read(contactsFilterProvider.notifier).state =
                            ContactsFilter(search: filter.search, type: t == 'todos' ? null : t);
                      },
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: contactsAsync.when(
                data: (resp) => resp.data.isEmpty
                    ? const Center(child: Text('Nenhum contato encontrado'))
                    : ListView.builder(
                        itemCount: resp.data.length,
                        itemBuilder: (_, i) => ContactCard(
                          person: resp.data[i],
                          onTap: () => context.push('/contacts/${resp.data[i].id}'),
                        ),
                      ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Erro: $e')),
              ),
            ),
          ],
        ),
      );
    }
  }
  ```

- [ ] Create `lib/features/crm/screens/contact_detail_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import 'package:intl/intl.dart';
  import '../providers/contacts_provider.dart';
  import '../widgets/timeline_item.dart';

  class ContactDetailScreen extends ConsumerWidget {
    final String personId;
    const ContactDetailScreen({super.key, required this.personId});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final personAsync = ref.watch(contactDetailProvider(personId));

      return personAsync.when(
        loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
        error: (e, _) => Scaffold(body: Center(child: Text('Erro: $e'))),
        data: (person) => DefaultTabController(
          length: 4,
          child: Scaffold(
            appBar: AppBar(
              title: Text(person.name),
              bottom: const TabBar(tabs: [
                Tab(text: 'Info'),
                Tab(text: 'Timeline'),
                Tab(text: 'Tarefas'),
                Tab(text: 'Tags'),
              ]),
            ),
            floatingActionButton: FloatingActionButton(
              child: const Icon(Icons.add_comment_outlined),
              onPressed: () => context.push('/contacts/$personId/add-interaction'),
            ),
            body: TabBarView(children: [
              // Tab 1: Info
              ListView(padding: const EdgeInsets.all(16), children: [
                _infoTile('Tipo', person.type ?? '-'),
                _infoTile('E-mail', person.email ?? '-'),
                _infoTile('Telefone', person.phone ?? '-'),
                _infoTile('Cidade', person.city ?? '-'),
                _infoTile('Bairro', person.neighborhood ?? '-'),
                _infoTile('Estágio no pipeline', person.stage ?? '-'),
                _infoTile('Cadastrado em',
                    person.createdAt != null ? DateFormat('dd/MM/yyyy').format(person.createdAt!) : '-'),
              ]),
              // Tab 2: Timeline
              _TimelineTab(personId: personId),
              // Tab 3: Tarefas
              _TasksTab(personId: personId),
              // Tab 4: Tags
              _TagsTab(person: person),
            ]),
          ),
        ),
      );
    }

    Widget _infoTile(String label, String value) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 16)),
          const Divider(),
        ]),
      );
    }
  }

  class _TimelineTab extends ConsumerWidget {
    final String personId;
    const _TimelineTab({required this.personId});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final interactionsAsync = ref.watch(interactionsProvider(personId));
      return interactionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (items) => items.isEmpty
            ? const Center(child: Text('Sem interações registradas'))
            : ListView.builder(
                itemCount: items.length,
                itemBuilder: (_, i) => TimelineItem.interaction(interaction: items[i]),
              ),
      );
    }
  }

  class _TasksTab extends ConsumerWidget {
    final String personId;
    const _TasksTab({required this.personId});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final tasksAsync = ref.watch(personTasksProvider(personId));
      return tasksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (tasks) => tasks.isEmpty
            ? Center(child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Sem tarefas'),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => context.push('/contacts/$personId/add-task'),
                    icon: const Icon(Icons.add),
                    label: const Text('Nova tarefa'),
                  ),
                ],
              ))
            : ListView.builder(
                itemCount: tasks.length,
                itemBuilder: (_, i) => TimelineItem.task(task: tasks[i]),
              ),
      );
    }
  }

  class _TagsTab extends StatelessWidget {
    final dynamic person;
    const _TagsTab({required this.person});

    @override
    Widget build(BuildContext context) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: person.tags.isEmpty
            ? const Center(child: Text('Sem tags'))
            : Wrap(
                spacing: 8,
                children: [
                  for (final tag in person.tags)
                    Chip(label: Text(tag.name)),
                ],
              ),
      );
    }
  }
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: CRM contacts list, detail screen with 4 tabs, models, service, providers"
  ```

---

## Chunk 5: CRM — Quick Actions

- [ ] Create `lib/features/crm/screens/add_interaction_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import 'package:intl/intl.dart';
  import '../providers/contacts_provider.dart';

  class AddInteractionScreen extends ConsumerStatefulWidget {
    final String personId;
    const AddInteractionScreen({super.key, required this.personId});

    @override
    ConsumerState<AddInteractionScreen> createState() => _AddInteractionScreenState();
  }

  class _AddInteractionScreenState extends ConsumerState<AddInteractionScreen> {
    final _formKey = GlobalKey<FormState>();
    String _type = 'call';
    String _direction = 'outbound';
    final _summaryController = TextEditingController();
    DateTime _occurredAt = DateTime.now();
    bool _loading = false;

    static const _types = ['call', 'meeting', 'message', 'email', 'event', 'note'];
    static const _directions = ['outbound', 'inbound'];

    @override
    void dispose() {
      _summaryController.dispose();
      super.dispose();
    }

    Future<void> _submit() async {
      if (!_formKey.currentState!.validate()) return;
      setState(() => _loading = true);
      try {
        final service = ref.read(crmServiceProvider);
        await service.createInteraction(widget.personId, {
          'type': _type,
          'direction': _direction,
          'summary': _summaryController.text.trim(),
          'occurred_at': _occurredAt.toIso8601String(),
        });
        ref.invalidate(interactionsProvider(widget.personId));
        if (mounted) context.pop();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro: $e')));
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(title: const Text('Registrar Interação')),
        body: Form(
          key: _formKey,
          child: ListView(padding: const EdgeInsets.all(16), children: [
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Tipo', border: OutlineInputBorder()),
              items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _direction,
              decoration: const InputDecoration(labelText: 'Direção', border: OutlineInputBorder()),
              items: _directions.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
              onChanged: (v) => setState(() => _direction = v!),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _summaryController,
              decoration: const InputDecoration(labelText: 'Resumo', border: OutlineInputBorder()),
              maxLines: 4,
              validator: (v) => (v == null || v.isEmpty) ? 'Informe o resumo' : null,
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Data: ${DateFormat('dd/MM/yyyy HH:mm').format(_occurredAt)}'),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _occurredAt,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (d != null) setState(() => _occurredAt = d);
              },
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Salvar'),
            ),
          ]),
        ),
      );
    }
  }
  ```

- [ ] Create `lib/features/crm/screens/add_task_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import 'package:intl/intl.dart';
  import '../providers/contacts_provider.dart';

  class AddTaskScreen extends ConsumerStatefulWidget {
    final String personId;
    const AddTaskScreen({super.key, required this.personId});

    @override
    ConsumerState<AddTaskScreen> createState() => _AddTaskScreenState();
  }

  class _AddTaskScreenState extends ConsumerState<AddTaskScreen> {
    final _formKey = GlobalKey<FormState>();
    final _titleController = TextEditingController();
    final _descController = TextEditingController();
    String _priority = 'medium';
    DateTime? _dueDate;
    bool _loading = false;

    static const _priorities = ['low', 'medium', 'high', 'urgent'];

    @override
    void dispose() {
      _titleController.dispose();
      _descController.dispose();
      super.dispose();
    }

    Future<void> _submit() async {
      if (!_formKey.currentState!.validate()) return;
      setState(() => _loading = true);
      try {
        final service = ref.read(crmServiceProvider);
        await service.createTask({
          'title': _titleController.text.trim(),
          'description': _descController.text.trim(),
          'priority': _priority,
          'person_id': widget.personId,
          if (_dueDate != null) 'due_date': _dueDate!.toIso8601String(),
        });
        ref.invalidate(personTasksProvider(widget.personId));
        ref.invalidate(myTasksProvider);
        if (mounted) context.pop();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro: $e')));
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(title: const Text('Nova Tarefa')),
        body: Form(
          key: _formKey,
          child: ListView(padding: const EdgeInsets.all(16), children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Título', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.isEmpty) ? 'Informe o título' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Descrição (opcional)', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _priority,
              decoration: const InputDecoration(labelText: 'Prioridade', border: OutlineInputBorder()),
              items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
              onChanged: (v) => setState(() => _priority = v!),
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_dueDate != null
                  ? 'Prazo: ${DateFormat('dd/MM/yyyy').format(_dueDate!)}'
                  : 'Sem prazo definido'),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (d != null) setState(() => _dueDate = d);
              },
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Criar tarefa'),
            ),
          ]),
        ),
      );
    }
  }
  ```

- [ ] Create `lib/features/crm/screens/my_tasks_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import 'package:intl/intl.dart';
  import '../providers/contacts_provider.dart';
  import '../models/task.dart';

  class MyTasksScreen extends ConsumerWidget {
    const MyTasksScreen({super.key});

    Color _priorityColor(String priority) => switch (priority) {
      'urgent' => Colors.red,
      'high' => Colors.orange,
      'medium' => Colors.blue,
      _ => Colors.grey,
    };

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final tasksAsync = ref.watch(myTasksProvider);

      return Scaffold(
        appBar: AppBar(title: const Text('Minhas Tarefas')),
        body: RefreshIndicator(
          onRefresh: () async => ref.invalidate(myTasksProvider),
          child: tasksAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Erro: $e')),
            data: (tasks) {
              final pending = tasks.where((t) => t.status != 'done' && t.status != 'cancelled').toList();
              if (pending.isEmpty) {
                return const Center(child: Text('Nenhuma tarefa pendente'));
              }
              return ListView.builder(
                itemCount: pending.length,
                itemBuilder: (_, i) {
                  final task = pending[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: ListTile(
                      leading: Icon(Icons.circle, color: _priorityColor(task.priority), size: 12),
                      title: Text(task.title),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (task.personName != null) Text(task.personName!),
                          if (task.dueDate != null)
                            Text(
                              'Prazo: ${DateFormat('dd/MM/yyyy').format(task.dueDate!)}',
                              style: TextStyle(
                                color: task.dueDate!.isBefore(DateTime.now()) ? Colors.red : null,
                              ),
                            ),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.check_circle_outline),
                        onPressed: () async {
                          await ref.read(crmServiceProvider).updateTaskStatus(task.id, 'done');
                          ref.invalidate(myTasksProvider);
                        },
                      ),
                      onTap: task.personId != null
                          ? () => context.push('/contacts/${task.personId}')
                          : null,
                    ),
                  );
                },
              );
            },
          ),
        ),
      );
    }
  }
  ```

- [ ] Create `lib/features/crm/screens/pipeline_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import '../providers/contacts_provider.dart';
  import '../models/person.dart';

  const _stages = [
    {'key': 'lead', 'label': 'Lead'},
    {'key': 'contacted', 'label': 'Contactado'},
    {'key': 'engaged', 'label': 'Engajado'},
    {'key': 'member', 'label': 'Membro'},
    {'key': 'leader', 'label': 'Líder'},
  ];

  final _pipelineProvider = FutureProvider.family<List<Person>, String>((ref, stage) async {
    final service = ref.watch(crmServiceProvider);
    return service.getPipelineStage(stage);
  });

  class PipelineScreen extends ConsumerWidget {
    const PipelineScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      return Scaffold(
        appBar: AppBar(title: const Text('Pipeline')),
        body: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _stages.length,
          itemBuilder: (_, i) {
            final stage = _stages[i];
            return _StageExpansion(stageKey: stage['key']!, stageLabel: stage['label']!);
          },
        ),
      );
    }
  }

  class _StageExpansion extends ConsumerWidget {
    final String stageKey;
    final String stageLabel;
    const _StageExpansion({required this.stageKey, required this.stageLabel});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final personsAsync = ref.watch(_pipelineProvider(stageKey));
      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: ExpansionTile(
          title: Row(children: [
            Text(stageLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(width: 8),
            personsAsync.when(
              data: (p) => Chip(label: Text('${p.length}'), padding: EdgeInsets.zero),
              loading: () => const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
              error: (_, __) => const Icon(Icons.error_outline, size: 16),
            ),
          ]),
          children: personsAsync.when(
            data: (persons) => persons.isEmpty
                ? [const ListTile(title: Text('Nenhum contato neste estágio'))]
                : persons.map((p) => ListTile(
                      title: Text(p.name),
                      subtitle: Text(p.city ?? ''),
                      onTap: () => GoRouter.of(context).push('/contacts/${p.id}'),
                    )).toList(),
            loading: () => [const Center(child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ))],
            error: (e, _) => [ListTile(title: Text('Erro: $e'))],
          ),
        ),
      );
    }
  }
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: CRM quick actions — add interaction, add task, my tasks list, pipeline screen"
  ```

---

## Chunk 6: Home Dashboard + Notifications

- [ ] Create `lib/shared/widgets/kpi_card.dart`:
  ```dart
  import 'package:flutter/material.dart';

  class KpiCard extends StatelessWidget {
    final String title;
    final String value;
    final IconData icon;
    final Color? color;
    final VoidCallback? onTap;

    const KpiCard({
      super.key,
      required this.title,
      required this.value,
      required this.icon,
      this.color,
      this.onTap,
    });

    @override
    Widget build(BuildContext context) {
      final theme = Theme.of(context);
      final cardColor = color ?? theme.colorScheme.primary;
      return Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: cardColor, size: 28),
                const SizedBox(height: 8),
                Text(
                  value,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: cardColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(title, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ),
      );
    }
  }
  ```

- [ ] Create `lib/shared/widgets/bottom_nav_bar.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:go_router/go_router.dart';

  class AppBottomNavBar extends StatelessWidget {
    final int currentIndex;
    const AppBottomNavBar({super.key, required this.currentIndex});

  static const _routes = ['/home', '/contacts', '/tasks', '/pipeline', '/campaigns'];

    @override
    Widget build(BuildContext context) {
      return NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) => context.go(_routes[i]),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.people_outlined), selectedIcon: Icon(Icons.people), label: 'Contatos'),
          NavigationDestination(icon: Icon(Icons.task_outlined), selectedIcon: Icon(Icons.task), label: 'Tarefas'),
          NavigationDestination(icon: Icon(Icons.account_tree_outlined), selectedIcon: Icon(Icons.account_tree), label: 'Pipeline'),
          NavigationDestination(icon: Icon(Icons.campaign_outlined), selectedIcon: Icon(Icons.campaign), label: 'Campanhas'),
        ],
      );
    }
  }
  ```

- [ ] Create `lib/features/home/screens/home_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import 'package:intl/intl.dart';
  import '../../../features/crm/providers/contacts_provider.dart';
  import '../../../shared/widgets/kpi_card.dart';
  import '../../../shared/widgets/bottom_nav_bar.dart';

  class HomeScreen extends ConsumerWidget {
    const HomeScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final tasksAsync = ref.watch(myTasksProvider);

      return Scaffold(
        appBar: AppBar(
          title: const Text('ShiftPartido'),
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () => context.push('/notifications'),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myTasksProvider);
            ref.invalidate(contactsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Resumo do dia', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              tasksAsync.when(
                data: (tasks) {
                  final pending = tasks.where((t) => t.status == 'pending' || t.status == 'in_progress').length;
                  final overdue = tasks.where((t) =>
                    t.dueDate != null && t.dueDate!.isBefore(DateTime.now()) &&
                    t.status != 'done' && t.status != 'cancelled').length;
                  return GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    childAspectRatio: 1.5,
                    children: [
                      KpiCard(
                        title: 'Tarefas pendentes',
                        value: '$pending',
                        icon: Icons.task_outlined,
                        onTap: () => context.go('/tasks'),
                      ),
                      KpiCard(
                        title: 'Atrasadas',
                        value: '$overdue',
                        icon: Icons.warning_amber_outlined,
                        color: overdue > 0 ? Colors.red : Colors.green,
                        onTap: () => context.go('/tasks'),
                      ),
                    ],
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Erro ao carregar: $e'),
              ),
              const SizedBox(height: 24),
              Text('Tarefas para hoje', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              tasksAsync.when(
                data: (tasks) {
                  final today = DateTime.now();
                  final todayTasks = tasks.where((t) =>
                    t.dueDate != null &&
                    t.dueDate!.year == today.year &&
                    t.dueDate!.month == today.month &&
                    t.dueDate!.day == today.day &&
                    t.status != 'done').toList();
                  if (todayTasks.isEmpty) return const Text('Nenhuma tarefa para hoje');
                  return Column(
                    children: todayTasks.map((t) => ListTile(
                      leading: const Icon(Icons.radio_button_unchecked),
                      title: Text(t.title),
                      subtitle: t.personName != null ? Text(t.personName!) : null,
                      contentPadding: EdgeInsets.zero,
                    )).toList(),
                  );
                },
                loading: () => const CircularProgressIndicator(),
                error: (e, _) => Text('Erro: $e'),
              ),
            ],
          ),
        ),
        bottomNavigationBar: const AppBottomNavBar(currentIndex: 0),
      );
    }
  }
  ```

- [ ] Create `lib/features/notifications/providers/notifications_provider.dart`:
  ```dart
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:freezed_annotation/freezed_annotation.dart';
  import 'package:dio/dio.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/dio_client.dart';
  import '../../../core/api/api_exception.dart';

  part 'notifications_provider.freezed.dart';
  part 'notifications_provider.g.dart';

  @freezed
  class AppNotification with _$AppNotification {
    const factory AppNotification({
      required String id,
      required String title,
      required String body,
      @JsonKey(name: 'is_read') @Default(false) bool isRead,
      @JsonKey(name: 'entity_type') String? entityType,
      @JsonKey(name: 'entity_id') String? entityId,
      @JsonKey(name: 'created_at') DateTime? createdAt,
    }) = _AppNotification;
    factory AppNotification.fromJson(Map<String, dynamic> json) => _$AppNotificationFromJson(json);
  }

  class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
    @override
    Future<List<AppNotification>> build() => _fetch();

    Future<List<AppNotification>> _fetch() async {
      final authService = ref.watch(authServiceProvider);
      final dio = DioClient.getInstance(authService);
      final response = await dio.get('/crm/notifications');
      final list = response.data['data'] as List;
      return list.map((e) => AppNotification.fromJson(e)).toList();
    }

    Future<void> markRead(String id) async {
      final authService = ref.read(authServiceProvider);
      final dio = DioClient.getInstance(authService);
      await dio.patch('/crm/notifications/$id/read');
      state = AsyncData(
        state.valueOrNull?.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList() ?? [],
      );
    }

    Future<void> markAllRead() async {
      final authService = ref.read(authServiceProvider);
      final dio = DioClient.getInstance(authService);
      await dio.post('/crm/notifications/read-all');
      state = AsyncData(
        state.valueOrNull?.map((n) => n.copyWith(isRead: true)).toList() ?? [],
      );
    }

    Future<void> refresh() async {
      state = const AsyncLoading();
      state = await AsyncValue.guard(_fetch);
    }
  }

  final notificationsProvider = AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
    NotificationsNotifier.new,
  );
  ```

- [ ] Create `lib/features/notifications/screens/notifications_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:intl/intl.dart';
  import '../providers/notifications_provider.dart';

  class NotificationsScreen extends ConsumerWidget {
    const NotificationsScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final notifAsync = ref.watch(notificationsProvider);

      return Scaffold(
        appBar: AppBar(
          title: const Text('Notificações'),
          actions: [
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
              child: const Text('Marcar todas como lidas'),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
          child: notifAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Erro: $e')),
            data: (notifications) => notifications.isEmpty
                ? const Center(child: Text('Nenhuma notificação'))
                : ListView.builder(
                    itemCount: notifications.length,
                    itemBuilder: (_, i) {
                      final n = notifications[i];
                      return ListTile(
                        tileColor: n.isRead ? null : Theme.of(context).colorScheme.primaryContainer.withOpacity(0.2),
                        leading: Icon(
                          n.isRead ? Icons.notifications_none : Icons.notifications,
                          color: n.isRead ? Colors.grey : Theme.of(context).colorScheme.primary,
                        ),
                        title: Text(n.title, style: TextStyle(
                          fontWeight: n.isRead ? FontWeight.normal : FontWeight.bold,
                        )),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.body),
                            if (n.createdAt != null)
                              Text(
                                DateFormat('dd/MM/yyyy HH:mm').format(n.createdAt!),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                          ],
                        ),
                        onTap: () => ref.read(notificationsProvider.notifier).markRead(n.id),
                        isThreeLine: true,
                      );
                    },
                  ),
          ),
        ),
      );
    }
  }
  ```

- [ ] Run code generation for new freezed models:
  ```bash
  dart run build_runner build --delete-conflicting-outputs
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: home dashboard with KPIs, notifications screen with mark-read"
  ```

---

## Chunk 7: Electoral Feature

- [ ] Create `lib/features/electoral/models/campaign.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  part 'campaign.freezed.dart';
  part 'campaign.g.dart';

  @freezed
  class Campaign with _$Campaign {
    const factory Campaign({
      required String id,
      required String name,
      required String status,        // planning, active, completed, cancelled
      String? position,              // vereador, deputado_estadual, etc
      @JsonKey(name: 'candidate_name') String? candidateName,
      @JsonKey(name: 'election_date') DateTime? electionDate,
      @JsonKey(name: 'budget_limit') double? budgetLimit,
      @JsonKey(name: 'budget_spent') double? budgetSpent,
      @Default([]) List<CampaignMember> team,
    }) = _Campaign;
    factory Campaign.fromJson(Map<String, dynamic> json) => _$CampaignFromJson(json);
  }

  @freezed
  class CampaignMember with _$CampaignMember {
    const factory CampaignMember({
      required String id,
      required String name,
      required String role,
    }) = _CampaignMember;
    factory CampaignMember.fromJson(Map<String, dynamic> json) => _$CampaignMemberFromJson(json);
  }
  ```

- [ ] Create `lib/features/electoral/models/schedule_event.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  part 'schedule_event.freezed.dart';
  part 'schedule_event.g.dart';

  @freezed
  class ScheduleEvent with _$ScheduleEvent {
    const factory ScheduleEvent({
      required String id,
      required String title,
      String? description,
      String? location,
      required String type,
      @JsonKey(name: 'start_at') required DateTime startAt,
      @JsonKey(name: 'end_at') DateTime? endAt,
      @JsonKey(name: 'campaign_id') String? campaignId,
    }) = _ScheduleEvent;
    factory ScheduleEvent.fromJson(Map<String, dynamic> json) => _$ScheduleEventFromJson(json);
  }
  ```

- [ ] Create `lib/features/electoral/services/electoral_service.dart`:
  ```dart
  import 'package:dio/dio.dart';
  import '../models/campaign.dart';
  import '../models/schedule_event.dart';
  import '../../../core/api/api_exception.dart';

  class ElectoralService {
    final Dio _dio;
    ElectoralService(this._dio);

    Future<List<Campaign>> getCampaigns() async {
      try {
        final response = await _dio.get('/electoral/campaigns');
        final list = response.data['data'] as List;
        return list.map((e) => Campaign.fromJson(e)).toList();
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<Campaign> getCampaign(String id) async {
      try {
        final response = await _dio.get('/electoral/campaigns/$id');
        return Campaign.fromJson(response.data['data']);
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }

    Future<List<ScheduleEvent>> getSchedule(String campaignId) async {
      try {
        final response = await _dio.get('/electoral/campaigns/$campaignId/schedule');
        final list = response.data['data'] as List;
        return list.map((e) => ScheduleEvent.fromJson(e)).toList();
      } on DioException catch (e) {
        throw ApiException.fromDioError(e);
      }
    }
  }
  ```

- [ ] Create `lib/features/electoral/providers/campaigns_provider.dart`:
  ```dart
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../services/electoral_service.dart';
  import '../models/campaign.dart';
  import '../models/schedule_event.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/dio_client.dart';

  final electoralServiceProvider = Provider<ElectoralService>((ref) {
    final authService = ref.watch(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    return ElectoralService(dio);
  });

  final campaignsProvider = FutureProvider<List<Campaign>>((ref) async {
    return ref.watch(electoralServiceProvider).getCampaigns();
  });

  final campaignDetailProvider = FutureProvider.family<Campaign, String>((ref, id) async {
    return ref.watch(electoralServiceProvider).getCampaign(id);
  });

  final campaignScheduleProvider = FutureProvider.family<List<ScheduleEvent>, String>((ref, campaignId) async {
    return ref.watch(electoralServiceProvider).getSchedule(campaignId);
  });
  ```

- [ ] Create `lib/features/electoral/widgets/campaign_budget_bar.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:intl/intl.dart';

  class CampaignBudgetBar extends StatelessWidget {
    final double budgetLimit;
    final double budgetSpent;

    const CampaignBudgetBar({
      super.key,
      required this.budgetLimit,
      required this.budgetSpent,
    });

    @override
    Widget build(BuildContext context) {
      final percentage = budgetLimit > 0 ? (budgetSpent / budgetLimit).clamp(0.0, 1.0) : 0.0;
      final fmt = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
      final color = percentage > 0.9 ? Colors.red : percentage > 0.7 ? Colors.orange : Colors.green;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Orçamento', style: Theme.of(context).textTheme.bodySmall),
            Text('${(percentage * 100).toStringAsFixed(1)}%',
                style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 4),
          LinearProgressIndicator(value: percentage, color: color, backgroundColor: Colors.grey.shade200),
          const SizedBox(height: 4),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(fmt.format(budgetSpent), style: Theme.of(context).textTheme.bodySmall),
            Text(fmt.format(budgetLimit), style: Theme.of(context).textTheme.bodySmall),
          ]),
        ],
      );
    }
  }
  ```

- [ ] Create `lib/features/electoral/screens/campaigns_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:go_router/go_router.dart';
  import '../providers/campaigns_provider.dart';
  import '../widgets/campaign_budget_bar.dart';
  import '../../../shared/widgets/bottom_nav_bar.dart';

  class CampaignsScreen extends ConsumerWidget {
    const CampaignsScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final campaignsAsync = ref.watch(campaignsProvider);
      return Scaffold(
        appBar: AppBar(title: const Text('Campanhas Eleitorais')),
        body: RefreshIndicator(
          onRefresh: () async => ref.invalidate(campaignsProvider),
          child: campaignsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Erro: $e')),
            data: (campaigns) => campaigns.isEmpty
                ? const Center(child: Text('Nenhuma campanha'))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: campaigns.length,
                    itemBuilder: (_, i) {
                      final c = campaigns[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => context.push('/campaigns/${c.id}'),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Expanded(child: Text(c.name, style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16))),
                                Chip(label: Text(c.status)),
                              ]),
                              if (c.candidateName != null) ...[
                                const SizedBox(height: 4),
                                Text('Candidato: ${c.candidateName}'),
                              ],
                              if (c.position != null) Text('Cargo: ${c.position}'),
                              if (c.budgetLimit != null && c.budgetSpent != null) ...[
                                const SizedBox(height: 12),
                                CampaignBudgetBar(
                                  budgetLimit: c.budgetLimit!,
                                  budgetSpent: c.budgetSpent!,
                                ),
                              ],
                            ]),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),
        bottomNavigationBar: const AppBottomNavBar(currentIndex: 4),
      );
    }
  }
  ```

- [ ] Create `lib/features/electoral/screens/campaign_detail_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:intl/intl.dart';
  import '../providers/campaigns_provider.dart';
  import '../widgets/campaign_budget_bar.dart';

  class CampaignDetailScreen extends ConsumerWidget {
    final String campaignId;
    const CampaignDetailScreen({super.key, required this.campaignId});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final campaignAsync = ref.watch(campaignDetailProvider(campaignId));
      final scheduleAsync = ref.watch(campaignScheduleProvider(campaignId));

      return campaignAsync.when(
        loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
        error: (e, _) => Scaffold(body: Center(child: Text('Erro: $e'))),
        data: (campaign) => DefaultTabController(
          length: 3,
          child: Scaffold(
            appBar: AppBar(
              title: Text(campaign.name),
              bottom: const TabBar(tabs: [
                Tab(text: 'Info'),
                Tab(text: 'Equipe'),
                Tab(text: 'Agenda'),
              ]),
            ),
            body: TabBarView(children: [
              // Tab 1: Info
              ListView(padding: const EdgeInsets.all(16), children: [
                if (campaign.candidateName != null) _tile('Candidato', campaign.candidateName!),
                if (campaign.position != null) _tile('Cargo', campaign.position!),
                _tile('Status', campaign.status),
                if (campaign.electionDate != null)
                  _tile('Data da eleição', DateFormat('dd/MM/yyyy').format(campaign.electionDate!)),
                if (campaign.budgetLimit != null && campaign.budgetSpent != null) ...[
                  const SizedBox(height: 16),
                  CampaignBudgetBar(
                    budgetLimit: campaign.budgetLimit!,
                    budgetSpent: campaign.budgetSpent!,
                  ),
                ],
              ]),
              // Tab 2: Equipe
              campaign.team.isEmpty
                  ? const Center(child: Text('Sem membros na equipe'))
                  : ListView.builder(
                      itemCount: campaign.team.length,
                      itemBuilder: (_, i) => ListTile(
                        leading: const Icon(Icons.person_outline),
                        title: Text(campaign.team[i].name),
                        subtitle: Text(campaign.team[i].role),
                      ),
                    ),
              // Tab 3: Agenda
              scheduleAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Erro: $e')),
                data: (events) => events.isEmpty
                    ? const Center(child: Text('Sem eventos'))
                    : ListView.builder(
                        itemCount: events.length,
                        itemBuilder: (_, i) {
                          final e = events[i];
                          return ListTile(
                            leading: const Icon(Icons.event_outlined),
                            title: Text(e.title),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(DateFormat('dd/MM/yyyy HH:mm').format(e.startAt)),
                                if (e.location != null) Text(e.location!),
                              ],
                            ),
                            isThreeLine: e.location != null,
                          );
                        },
                      ),
              ),
            ]),
          ),
        ),
      );
    }

    Widget _tile(String label, String value) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 16)),
          const Divider(),
        ]),
      );
    }
  }
  ```

- [ ] Run code generation:
  ```bash
  dart run build_runner build --delete-conflicting-outputs
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: electoral campaigns list, detail screen with team/schedule tabs, budget bar"
  ```

---

## Chunk 8: Party + Mandates Features

- [ ] Create `lib/features/mandates/models/mandate.dart`:
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  part 'mandate.freezed.dart';
  part 'mandate.g.dart';

  @freezed
  class Mandate with _$Mandate {
    const factory Mandate({
      required String id,
      required String title,
      String? description,
      @JsonKey(name: 'holder_name') String? holderName,
      required String level,        // federal, estadual, municipal
      required String status,       // active, completed, cancelled
      @JsonKey(name: 'start_date') DateTime? startDate,
      @JsonKey(name: 'end_date') DateTime? endDate,
    }) = _Mandate;
    factory Mandate.fromJson(Map<String, dynamic> json) => _$MandateFromJson(json);
  }
  ```

- [ ] Create `lib/features/party/screens/chapters_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/dio_client.dart';
  import '../../../core/api/api_exception.dart';

  class _Chapter {
    final String id;
    final String name;
    final String level;
    final String? parentId;
    final List<_Chapter> children;
    _Chapter({required this.id, required this.name, required this.level, this.parentId, this.children = const []});
    factory _Chapter.fromJson(Map<String, dynamic> j) => _Chapter(
      id: j['id'], name: j['name'], level: j['level'] ?? '', parentId: j['parent_id']);
  }

  final _chaptersProvider = FutureProvider<List<_Chapter>>((ref) async {
    final authService = ref.watch(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    final response = await dio.get('/party/chapters');
    final list = (response.data['data'] as List).map((e) => _Chapter.fromJson(e)).toList();
    // Monta árvore: nacional → estadual → municipal
    final roots = list.where((c) => c.parentId == null).toList();
    return roots;
  });

  class ChaptersScreen extends ConsumerWidget {
    const ChaptersScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final chaptersAsync = ref.watch(_chaptersProvider);
      return Scaffold(
        appBar: AppBar(title: const Text('Diretórios')),
        body: chaptersAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (chapters) => chapters.isEmpty
              ? const Center(child: Text('Sem diretórios'))
              : ListView.builder(
                  itemCount: chapters.length,
                  itemBuilder: (_, i) => _ChapterTile(chapter: chapters[i], depth: 0),
                ),
        ),
      );
    }
  }

  class _ChapterTile extends StatelessWidget {
    final _Chapter chapter;
    final int depth;
    const _ChapterTile({required this.chapter, required this.depth});

    @override
    Widget build(BuildContext context) {
      return Padding(
        padding: EdgeInsets.only(left: depth * 16.0),
        child: chapter.children.isEmpty
            ? ListTile(
                leading: const Icon(Icons.location_city_outlined),
                title: Text(chapter.name),
                subtitle: Text(chapter.level),
              )
            : ExpansionTile(
                leading: const Icon(Icons.account_balance_outlined),
                title: Text(chapter.name),
                subtitle: Text(chapter.level),
                children: chapter.children
                    .map((c) => _ChapterTile(chapter: c, depth: depth + 1))
                    .toList(),
              ),
      );
    }
  }
  ```

- [ ] Create `lib/features/party/screens/organs_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/dio_client.dart';

  final _organsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
    final authService = ref.watch(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    final response = await dio.get('/party/organs');
    return (response.data['data'] as List).cast<Map<String, dynamic>>();
  });

  class OrgansScreen extends ConsumerWidget {
    const OrgansScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final organsAsync = ref.watch(_organsProvider);
      return Scaffold(
        appBar: AppBar(title: const Text('Órgãos Partidários')),
        body: organsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (organs) => organs.isEmpty
              ? const Center(child: Text('Sem órgãos cadastrados'))
              : ListView.builder(
                  itemCount: organs.length,
                  itemBuilder: (_, i) {
                    final o = organs[i];
                    return ListTile(
                      leading: const Icon(Icons.groups_outlined),
                      title: Text(o['name'] ?? ''),
                      subtitle: Text(o['type'] ?? ''),
                    );
                  },
                ),
        ),
      );
    }
  }
  ```

- [ ] Create `lib/features/mandates/screens/mandates_screen.dart`:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:intl/intl.dart';
  import '../models/mandate.dart';
  import '../../../core/auth/auth_provider.dart';
  import '../../../core/api/dio_client.dart';

  final _mandatesProvider = FutureProvider<List<Mandate>>((ref) async {
    final authService = ref.watch(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    final response = await dio.get('/party/mandates');
    final list = response.data['data'] as List;
    return list.map((e) => Mandate.fromJson(e)).toList();
  });

  class MandatesScreen extends ConsumerWidget {
    const MandatesScreen({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final mandatesAsync = ref.watch(_mandatesProvider);
      return Scaffold(
        appBar: AppBar(title: const Text('Mandatos')),
        body: mandatesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (mandates) => mandates.isEmpty
              ? const Center(child: Text('Sem mandatos'))
              : ListView.builder(
                  itemCount: mandates.length,
                  itemBuilder: (_, i) {
                    final m = mandates[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: const Icon(Icons.gavel_outlined),
                        title: Text(m.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (m.holderName != null) Text(m.holderName!),
                            Text('${m.level} · ${m.status}'),
                            if (m.startDate != null)
                              Text('Início: ${DateFormat('dd/MM/yyyy').format(m.startDate!)}'),
                          ],
                        ),
                        isThreeLine: m.holderName != null,
                      ),
                    );
                  },
                ),
        ),
      );
    }
  }
  ```

- [ ] Run code generation:
  ```bash
  dart run build_runner build --delete-conflicting-outputs
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: party chapters/organs screens, mandates screen and model"
  ```

---

## Chunk 9: Push Notifications (FCM)

- [ ] Configure FCM in Firebase Console:
  1. Enable Cloud Messaging in the Firebase project
  2. Confirm `google-services.json` and `GoogleService-Info.plist` are in place (Chunk 1)
  3. In iOS: enable Push Notifications capability in Xcode (Runner → Signing & Capabilities → + Capability → Push Notifications)
  4. Also enable Background Modes → Remote notifications in Xcode

- [ ] Create `lib/core/notifications/fcm_service.dart`:
  ```dart
  import 'package:firebase_messaging/firebase_messaging.dart';
  import 'package:flutter/material.dart';
  import 'package:go_router/go_router.dart';
  import 'package:dio/dio.dart';

  // Handler de background (fora da classe, nível top-level)
  @pragma('vm:entry-point')
  Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    // Processamento mínimo em background — apenas log
    debugPrint('Background FCM: ${message.messageId}');
  }

  class FcmService {
    final FirebaseMessaging _messaging = FirebaseMessaging.instance;
    final Dio _dio;
    final GlobalKey<NavigatorState> navigatorKey;

    FcmService({required this._dio, required this.navigatorKey});

    Future<void> initialize() async {
      // Solicita permissão (iOS)
      await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      // Handler de mensagens em background (deve ser registrado no main)
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // Foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Tap em notificação com app fechado → quando app abre
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessageTap(initialMessage);
      }

      // Tap em notificação com app em background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);
    }

    /// Registra o token FCM no backend após login
    Future<void> registerToken() async {
      final token = await _messaging.getToken();
      if (token == null) return;
      await _dio.post('/crm/device-tokens', data: {
        'token': token,
        'platform': _platform(),
      });
      // Atualiza token quando renovado
      _messaging.onTokenRefresh.listen((newToken) async {
        await _dio.post('/crm/device-tokens', data: {
          'token': newToken,
          'platform': _platform(),
        });
      });
    }

    /// Remove token FCM no backend ao fazer logout
    Future<void> unregisterToken() async {
      final token = await _messaging.getToken();
      if (token == null) return;
      await _dio.delete('/crm/device-tokens', data: {'token': token});
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
        ),
      );
    }

    void _handleMessageTap(RemoteMessage message) {
      final data = message.data;
      final entityType = data['entity_type'];
      final entityId = data['entity_id'];
      final router = navigatorKey.currentContext != null
          ? GoRouter.of(navigatorKey.currentContext!)
          : null;
      if (router == null || entityId == null) return;

      switch (entityType) {
        case 'person':
          router.push('/contacts/$entityId');
        case 'task':
          router.push('/tasks');
        case 'campaign':
          router.push('/campaigns/$entityId');
        default:
          router.push('/notifications');
      }
    }

    String _platform() {
      // Usa defaultTargetPlatform para detectar iOS vs Android
      return 'android'; // substituir por Platform.isIOS ? 'ios' : 'android'
    }
  }
  ```

- [ ] Update `lib/main.dart` to initialize FCM:
  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:firebase_core/firebase_core.dart';
  import 'core/router/app_router.dart';
  import 'core/theme/app_theme.dart';
  import 'core/notifications/fcm_service.dart';

  final navigatorKey = GlobalKey<NavigatorState>();

  void main() async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    runApp(const ProviderScope(child: ShiftPartidoApp()));
  }

  class ShiftPartidoApp extends ConsumerWidget {
    const ShiftPartidoApp({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final router = ref.watch(routerProvider);
      return MaterialApp.router(
        title: 'ShiftPartido',
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      );
    }
  }
  ```

- [ ] After login success in `auth_notifier.dart`, call `FcmService.registerToken()`.

- [ ] After logout in `auth_notifier.dart`, call `FcmService.unregisterToken()`.

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: FCM push notifications with foreground SnackBar and tap-to-navigate"
  ```

---

## Chunk 10: Final Polish + Testing

- [ ] Add `pull-to-refresh` to contacts screen (already uses `RefreshIndicator` pattern — verify all list screens have it):
  - `contacts_screen.dart` — wrap `ListView.builder` in `RefreshIndicator` and call `ref.invalidate(contactsProvider)`
  - `my_tasks_screen.dart` — already implemented
  - `campaigns_screen.dart` — already implemented

- [ ] Add empty state widgets to all screens. Verify:
  - Contacts: "Nenhum contato encontrado"
  - My Tasks: "Nenhuma tarefa pendente"
  - Pipeline: "Nenhum contato neste estágio"
  - Notifications: "Nenhuma notificação"
  - Campaigns: "Nenhuma campanha"

- [ ] Add global error handling in `main.dart`:
  ```dart
  FlutterError.onError = (details) {
    debugPrint('Flutter error: ${details.exception}');
  };
  ```

- [ ] Configure app icon using `flutter_launcher_icons` (optional package):
  1. Add to `dev_dependencies`: `flutter_launcher_icons: ^0.13.0`
  2. Create `flutter_launcher_icons.yaml` with icon asset path
  3. Run `dart run flutter_launcher_icons`

- [ ] Configure splash screen using `flutter_native_splash` (optional):
  1. Add to `dev_dependencies`: `flutter_native_splash: ^2.4.0`
  2. Create `flutter_native_splash.yaml`
  3. Run `dart run flutter_native_splash:create`

- [ ] Test on Android emulator — complete flow:
  ```
  1. flutter run (Android emulator)
  2. Login com credenciais válidas
  3. Navegar para Contatos → abrir contato
  4. Registrar interação via FAB
  5. Criar tarefa via aba Tarefas
  6. Verificar tarefa aparece em "Minhas Tarefas"
  7. Marcar tarefa como concluída
  8. Navegar para Pipeline → verificar estágios
  9. Navegar para Campanhas → abrir campanha → abas Info/Equipe/Agenda
  10. Logout → confirmar redirect para /login
  ```

- [ ] Test on iOS simulator:
  ```bash
  flutter run -d "iPhone 15"
  ```
  Repeat same flow above.

- [ ] Run final build:
  ```bash
  # Android
  flutter build apk --release
  # iOS
  flutter build ios --release --no-codesign
  ```

- [ ] Git commit:
  ```bash
  git add -A && git commit -m "feat: polish — empty states, pull-to-refresh, error handling, build verification"
  ```

---

## Summary

| Chunk | Feature | Key Files |
|-------|---------|-----------|
| 1 | Project setup | `pubspec.yaml`, folder structure, Firebase config |
| 2 | Core API + Auth | `dio_client.dart`, `auth_service.dart`, `app_router.dart` |
| 3 | Login screen | `login_screen.dart`, `auth_notifier.dart` |
| 4 | CRM Contacts | `person.dart`, `crm_service.dart`, `contacts_screen.dart`, `contact_detail_screen.dart` |
| 5 | CRM Quick Actions | `add_interaction_screen.dart`, `add_task_screen.dart`, `my_tasks_screen.dart`, `pipeline_screen.dart` |
| 6 | Home + Notifications | `home_screen.dart`, `notifications_screen.dart`, `kpi_card.dart` |
| 7 | Electoral | `campaign.dart`, `campaigns_screen.dart`, `campaign_detail_screen.dart`, `campaign_budget_bar.dart` |
| 8 | Party + Mandates | `chapters_screen.dart`, `organs_screen.dart`, `mandates_screen.dart` |
| 9 | Push Notifications | `fcm_service.dart`, FCM token registration |
| 10 | Polish + Testing | Empty states, pull-to-refresh, build verification |
