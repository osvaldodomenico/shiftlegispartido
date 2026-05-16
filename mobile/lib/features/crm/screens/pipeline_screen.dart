import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/contacts_provider.dart';
import '../widgets/contact_card.dart';

const _stages = [
  'lead',
  'prospect',
  'qualified',
  'negotiation',
  'won',
  'lost',
];

class PipelineScreen extends ConsumerWidget {
  const PipelineScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: _stages.length,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Pipeline'),
          bottom: TabBar(
            isScrollable: true,
            tabs: _stages.map((s) => Tab(text: s)).toList(),
          ),
        ),
        body: TabBarView(
          children: _stages.map((stage) => _StageTab(stage: stage)).toList(),
        ),
      ),
    );
  }
}

class _StageTab extends ConsumerWidget {
  final String stage;
  const _StageTab({required this.stage});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final personsAsync = ref.watch(pipelineStageProvider(stage));
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(pipelineStageProvider(stage)),
      child: personsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro ao carregar: $e')),
        data: (persons) => persons.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.people_outline,
                        size: 64, color: Colors.grey),
                    const SizedBox(height: 12),
                    Text('Nenhum contato em "$stage"',
                        style: const TextStyle(
                            color: Colors.grey, fontSize: 16)),
                  ],
                ),
              )
            : ListView.builder(
                itemCount: persons.length,
                itemBuilder: (_, i) => ContactCard(
                  person: persons[i],
                  onTap: () => context.push('/contacts/${persons[i].id}'),
                ),
              ),
      ),
    );
  }
}
