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
              onChanged: (v) =>
                  ref.read(contactsFilterProvider.notifier).state =
                      ContactsFilter(
                          search: v,
                          type: filter.type == 'todos' ? null : filter.type),
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
                final selected =
                    (filter.type == null && t == 'todos') || filter.type == t;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(t),
                    selected: selected,
                    onSelected: (_) {
                      ref.read(contactsFilterProvider.notifier).state =
                          ContactsFilter(
                              search: filter.search,
                              type: t == 'todos' ? null : t);
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
                        onTap: () =>
                            context.push('/contacts/${resp.data[i].id}'),
                      ),
                    ),
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Erro: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
