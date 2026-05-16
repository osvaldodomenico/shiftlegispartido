import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/dio_client.dart';

/// Modelo de notificação da plataforma.
class AppNotification {
  final String id;
  final String title;
  final String body;
  final bool isRead;
  final String? entityType;
  final String? entityId;
  final DateTime? createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.isRead = false,
    this.entityType,
    this.entityId,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      isRead: (json['is_read'] as bool?) ?? false,
      entityType: json['entity_type'] as String?,
      entityId: json['entity_id'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      isRead: isRead ?? this.isRead,
      entityType: entityType,
      entityId: entityId,
      createdAt: createdAt,
    );
  }
}

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() => _fetch();

  Future<List<AppNotification>> _fetch() async {
    final authService = ref.watch(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    final response = await dio.get('/crm/notifications');
    final list = response.data['data'] as List;
    return list.map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markRead(String id) async {
    final authService = ref.read(authServiceProvider);
    final dio = DioClient.getInstance(authService);
    await dio.patch('/crm/notifications/$id/read');
    state = AsyncData(
      state.valueOrNull
              ?.map((n) => n.id == id ? n.copyWith(isRead: true) : n)
              .toList() ??
          [],
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

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);
