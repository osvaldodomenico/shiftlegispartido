import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/mandate.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/dio_client.dart';

final _mandatesProvider = FutureProvider<List<Mandate>>((ref) async {
  final authService = ref.watch(authServiceProvider);
  final dio = DioClient.getInstance(authService);
  final response = await dio.get('/party/mandates');
  final list = response.data['data'] as List;
  return list.map((e) => Mandate.fromJson(e)).toList();
});

class MandatesScreen extends ConsumerWidget {
  const MandatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mandatesAsync = ref.watch(_mandatesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Mandatos')),
      body: mandatesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (mandates) => mandates.isEmpty
            ? const Center(child: Text('Sem mandatos'))
            : ListView.builder(
                itemCount: mandates.length,
                itemBuilder: (_, i) {
                  final m = mandates[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    child: ListTile(
                      leading: const Icon(Icons.gavel_outlined),
                      title: Text(m.title),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (m.holderName != null) Text(m.holderName!),
                          Text('${m.level} · ${m.status}'),
                          if (m.startDate != null)
                            Text(
                              'Início: ${DateFormat('dd/MM/yyyy').format(m.startDate!)}',
                            ),
                        ],
                      ),
                      isThreeLine: m.holderName != null,
                    ),
                  );
                },
              ),
      ),
    );
  }
}
