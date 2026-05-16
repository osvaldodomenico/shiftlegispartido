import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/campaigns_provider.dart';
import '../widgets/campaign_budget_bar.dart';

class CampaignDetailScreen extends ConsumerWidget {
  final String campaignId;
  const CampaignDetailScreen({super.key, required this.campaignId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignAsync = ref.watch(campaignDetailProvider(campaignId));
    final scheduleAsync = ref.watch(campaignScheduleProvider(campaignId));

    return campaignAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Erro: $e'))),
      data: (campaign) => DefaultTabController(
        length: 3,
        child: Scaffold(
          appBar: AppBar(
            title: Text(campaign.name),
            bottom: const TabBar(tabs: [
              Tab(text: 'Info'),
              Tab(text: 'Equipe'),
              Tab(text: 'Agenda'),
            ]),
          ),
          body: TabBarView(children: [
            // Tab 1: Info
            ListView(padding: const EdgeInsets.all(16), children: [
              if (campaign.candidateName != null)
                _tile('Candidato', campaign.candidateName!),
              if (campaign.position != null)
                _tile('Cargo', campaign.position!),
              _tile('Status', campaign.status),
              if (campaign.electionDate != null)
                _tile('Data da eleição',
                    DateFormat('dd/MM/yyyy').format(campaign.electionDate!)),
              if (campaign.budgetLimit != null &&
                  campaign.budgetSpent != null) ...[
                const SizedBox(height: 16),
                CampaignBudgetBar(
                  budgetLimit: campaign.budgetLimit!,
                  budgetSpent: campaign.budgetSpent!,
                ),
              ],
            ]),
            // Tab 2: Equipe
            campaign.team.isEmpty
                ? const Center(child: Text('Sem membros na equipe'))
                : ListView.builder(
                    itemCount: campaign.team.length,
                    itemBuilder: (_, i) => ListTile(
                      leading: const Icon(Icons.person_outline),
                      title: Text(campaign.team[i].name),
                      subtitle: Text(campaign.team[i].role),
                    ),
                  ),
            // Tab 3: Agenda
            scheduleAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Erro: $e')),
              data: (events) => events.isEmpty
                  ? const Center(child: Text('Sem eventos'))
                  : ListView.builder(
                      itemCount: events.length,
                      itemBuilder: (_, i) {
                        final e = events[i];
                        return ListTile(
                          leading: const Icon(Icons.event_outlined),
                          title: Text(e.title),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(DateFormat('dd/MM/yyyy HH:mm')
                                  .format(e.startAt)),
                              if (e.location != null) Text(e.location!),
                            ],
                          ),
                          isThreeLine: e.location != null,
                        );
                      },
                    ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _tile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 16)),
        const Divider(),
      ]),
    );
  }
}
