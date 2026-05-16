import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/interaction.dart';
import '../models/task.dart';

class TimelineItem extends StatelessWidget {
  final Interaction? interaction;
  final Task? task;

  const TimelineItem.interaction(
      {super.key, required Interaction this.interaction})
      : task = null;
  const TimelineItem.task({super.key, required Task this.task})
      : interaction = null;

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
          child: Icon(_interactionIcon(i.type),
              color: theme.colorScheme.onSecondaryContainer, size: 20),
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
            t.status == 'done'
                ? Icons.check_circle_outline
                : Icons.task_outlined,
            color:
                t.status == 'done' ? Colors.green : theme.colorScheme.error,
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
