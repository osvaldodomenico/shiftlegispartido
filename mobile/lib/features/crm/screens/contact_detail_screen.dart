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
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
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
            onPressed: () =>
                context.push('/contacts/$personId/add-interaction'),
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
              _infoTile(
                  'Cadastrado em',
                  person.createdAt != null
                      ? DateFormat('dd/MM/yyyy').format(person.createdAt!)
                      : '-'),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 15)),
          const Divider(),
        ],
      ),
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
              itemBuilder: (_, i) =>
                  TimelineItem.interaction(interaction: items[i]),
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
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Sem tarefas'),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () =>
                        context.push('/contacts/$personId/add-task'),
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
                for (final tag in person.tags) Chip(label: Text(tag.name)),
              ],
            ),
    );
  }
}
