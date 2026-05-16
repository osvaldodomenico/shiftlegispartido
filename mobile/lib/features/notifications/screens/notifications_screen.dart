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
            onPressed: () =>
                ref.read(notificationsProvider.notifier).markAllRead(),
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
                      tileColor: n.isRead
                          ? null
                          : Theme.of(context)
                              .colorScheme
                              .primaryContainer
                              // ignore: deprecated_member_use
                              .withOpacity(0.2),
                      leading: Icon(
                        n.isRead
                            ? Icons.notifications_none
                            : Icons.notifications,
                        color: n.isRead
                            ? Colors.grey
                            : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(
                        n.title,
                        style: TextStyle(
                          fontWeight: n.isRead
                              ? FontWeight.normal
                              : FontWeight.bold,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(n.body),
                          if (n.createdAt != null)
                            Text(
                              DateFormat('dd/MM/yyyy HH:mm')
                                  .format(n.createdAt!),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                      onTap: () => ref
                          .read(notificationsProvider.notifier)
                          .markRead(n.id),
                      isThreeLine: true,
                    );
                  },
                ),
        ),
      ),
    );
  }
}
