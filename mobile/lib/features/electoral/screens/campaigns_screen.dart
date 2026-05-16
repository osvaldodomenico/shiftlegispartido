import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/campaigns_provider.dart';
import '../widgets/campaign_budget_bar.dart';
import '../../../shared/widgets/bottom_nav_bar.dart';

class CampaignsScreen extends ConsumerWidget {
  const CampaignsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignsAsync = ref.watch(campaignsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Campanhas Eleitorais')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(campaignsProvider),
        child: campaignsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (campaigns) => campaigns.isEmpty
              ? const Center(child: Text('Nenhuma campanha'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: campaigns.length,
                  itemBuilder: (_, i) {
                    final c = campaigns[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: () => context.push('/campaigns/${c.id}'),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Expanded(
                                  child: Text(
                                    c.name,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                ),
                                Chip(label: Text(c.status)),
                              ]),
                              if (c.candidateName != null) ...[
                                const SizedBox(height: 4),
                                Text('Candidato: ${c.candidateName}'),
                              ],
                              if (c.position != null)
                                Text('Cargo: ${c.position}'),
                              if (c.budgetLimit != null &&
                                  c.budgetSpent != null) ...[
                                const SizedBox(height: 12),
                                CampaignBudgetBar(
                                  budgetLimit: c.budgetLimit!,
                                  budgetSpent: c.budgetSpent!,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentIndex: 4),
    );
  }
}
