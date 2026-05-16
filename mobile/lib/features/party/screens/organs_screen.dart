import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/dio_client.dart';

final _organsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final authService = ref.watch(authServiceProvider);
  final dio = DioClient.getInstance(authService);
  final response = await dio.get('/party/organs');
  return (response.data['data'] as List).cast<Map<String, dynamic>>();
});

class OrgansScreen extends ConsumerWidget {
  const OrgansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final organsAsync = ref.watch(_organsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Órgãos Partidários')),
      body: organsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (organs) => organs.isEmpty
            ? const Center(child: Text('Sem órgãos cadastrados'))
            : ListView.builder(
                itemCount: organs.length,
                itemBuilder: (_, i) {
                  final o = organs[i];
                  return ListTile(
                    leading: const Icon(Icons.groups_outlined),
                    title: Text(o['name'] ?? ''),
                    subtitle: Text(o['type'] ?? ''),
                  );
                },
              ),
      ),
    );
  }
}
