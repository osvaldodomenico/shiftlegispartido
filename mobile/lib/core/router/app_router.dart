import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_provider.dart';
import '../notifications/fcm_provider.dart';
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
    navigatorKey: navigatorKey,
    initialLocation: '/home',
    redirect: (context, state) {
      // Enquanto verifica o token, não redireciona
      if (authAsync.isLoading) return null;

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
        builder: (_, state) =>
            ContactDetailScreen(personId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/tasks', builder: (_, __) => const MyTasksScreen()),
      GoRoute(path: '/pipeline', builder: (_, __) => const PipelineScreen()),
      GoRoute(
        path: '/contacts/:id/add-interaction',
        builder: (_, state) =>
            AddInteractionScreen(personId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/contacts/:id/add-task',
        builder: (_, state) =>
            AddTaskScreen(personId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/campaigns', builder: (_, __) => const CampaignsScreen()),
      GoRoute(
        path: '/campaigns/:id',
        builder: (_, state) =>
            CampaignDetailScreen(campaignId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(path: '/chapters', builder: (_, __) => const ChaptersScreen()),
      GoRoute(path: '/organs', builder: (_, __) => const OrgansScreen()),
      GoRoute(path: '/mandates', builder: (_, __) => const MandatesScreen()),
    ],
  );
});
