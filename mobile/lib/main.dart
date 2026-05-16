import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/notifications/fcm_service.dart';
import 'core/notifications/fcm_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Captura erros Flutter não tratados (widgets, layout, etc.)
  FlutterError.onError = (details) {
    debugPrint('Flutter error: ${details.exception}');
  };

  await Firebase.initializeApp();

  // Handler de background precisa ser registrado antes de runApp
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  runApp(const ProviderScope(child: ShiftPartidoApp()));
}

class ShiftPartidoApp extends ConsumerStatefulWidget {
  const ShiftPartidoApp({super.key});

  @override
  ConsumerState<ShiftPartidoApp> createState() => _ShiftPartidoAppState();
}

class _ShiftPartidoAppState extends ConsumerState<ShiftPartidoApp> {
  @override
  void initState() {
    super.initState();
    // Inicializa FCM após o primeiro frame (router já está pronto)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fcmServiceProvider).initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
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
