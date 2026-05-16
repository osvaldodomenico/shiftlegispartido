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
    final contactsAsync = ref.watch(contactsProvider);

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
                final pending = tasks
                    .where((t) => t.status == 'pending' || t.status == 'in_progress')
                    .length;
                final overdue = tasks
                    .where((t) =>
                        t.dueDate != null &&
                        t.dueDate!.isBefore(DateTime.now()) &&
                        t.status != 'done' &&
                        t.status != 'cancelled')
                    .length;
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
              error: (e, _) => Text('Erro ao carregar tarefas: $e'),
            ),
            const SizedBox(height: 16),
            contactsAsync.when(
              data: (resp) => GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 1.5,
                children: [
                  KpiCard(
                    title: 'Total de contatos',
                    value: '${resp.total}',
                    icon: Icons.people_outlined,
                    onTap: () => context.go('/contacts'),
                  ),
                ],
              ),
              loading: () => const SizedBox.shrink(),
              error: (e, _) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
            Text('Tarefas para hoje', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            tasksAsync.when(
              data: (tasks) {
                final today = DateTime.now();
                final todayTasks = tasks
                    .where((t) =>
                        t.dueDate != null &&
                        t.dueDate!.year == today.year &&
                        t.dueDate!.month == today.month &&
                        t.dueDate!.day == today.day &&
                        t.status != 'done')
                    .toList();
                if (todayTasks.isEmpty) {
                  return const Text('Nenhuma tarefa para hoje.');
                }
                return Column(
                  children: todayTasks.map((task) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.task_alt_outlined),
                        title: Text(task.title),
                        subtitle: task.dueDate != null
                            ? Text(DateFormat('HH:mm').format(task.dueDate!))
                            : null,
                        trailing: Chip(
                          label: Text(task.priority,
                              style: const TextStyle(fontSize: 11)),
                          padding: EdgeInsets.zero,
                        ),
                        onTap: task.personId != null
                            ? () => context.push('/contacts/${task.personId}')
                            : null,
                      ),
                    );
                  }).toList(),
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
