import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/contacts_provider.dart';

class MyTasksScreen extends ConsumerWidget {
  const MyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(myTasksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Minhas Tarefas')),
      body: tasksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (tasks) {
          if (tasks.isEmpty) {
            return const Center(child: Text('Nenhuma tarefa atribuída a você'));
          }
          return ListView.builder(
            itemCount: tasks.length,
            itemBuilder: (_, i) {
              final t = tasks[i];
              final isDone = t.status == 'done';
              return ListTile(
                leading: Checkbox(
                  value: isDone,
                  onChanged: isDone
                      ? null
                      : (_) async {
                          try {
                            final service = ref.read(crmServiceProvider);
                            await service.updateTaskStatus(t.id, 'done');
                            ref.invalidate(myTasksProvider);
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Erro: $e')));
                            }
                          }
                        },
                ),
                title: Text(t.title,
                    style: TextStyle(
                        decoration:
                            isDone ? TextDecoration.lineThrough : null)),
                subtitle: Text([
                  t.priority,
                  if (t.personName != null) t.personName!,
                  if (t.dueDate != null)
                    DateFormat('dd/MM/yyyy').format(t.dueDate!),
                ].join(' · ')),
                trailing: _priorityIcon(t.priority),
              );
            },
          );
        },
      ),
    );
  }

  Widget _priorityIcon(String priority) {
    final color = switch (priority) {
      'urgent' => Colors.red,
      'high' => Colors.orange,
      'medium' => Colors.amber,
      _ => Colors.grey,
    };
    return Icon(Icons.flag_outlined, color: color, size: 18);
  }
}
