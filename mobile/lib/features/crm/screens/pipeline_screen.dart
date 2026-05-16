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
    return personsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
      data: (persons) => persons.isEmpty
          ? Center(child: Text('Nenhum contato em "$stage"'))
          : ListView.builder(
              itemCount: persons.length,
              itemBuilder: (_, i) => ContactCard(
                person: persons[i],
                onTap: () => context.push('/contacts/${persons[i].id}'),
              ),
            ),
    );
  }
}
