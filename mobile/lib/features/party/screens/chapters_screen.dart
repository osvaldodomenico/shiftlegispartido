import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/dio_client.dart';

class _Chapter {
  final String id;
  final String name;
  final String level;
  final String? parentId;
  final List<_Chapter> children;
  _Chapter({
    required this.id,
    required this.name,
    required this.level,
    this.parentId,
    this.children = const [],
  });
  factory _Chapter.fromJson(Map<String, dynamic> j) => _Chapter(
        id: j['id'],
        name: j['name'],
        level: j['level'] ?? '',
        parentId: j['parent_id'],
      );
}

final _chaptersProvider = FutureProvider<List<_Chapter>>((ref) async {
  final authService = ref.watch(authServiceProvider);
  final dio = DioClient.getInstance(authService);
  final response = await dio.get('/party/chapters');
  final flat = (response.data['data'] as List)
      .map((e) => _Chapter.fromJson(e))
      .toList();
  // Monta árvore: capítulos sem parent_id são raízes
  final roots = flat.where((c) => c.parentId == null).toList();
  return roots;
});

class ChaptersScreen extends ConsumerWidget {
  const ChaptersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chaptersAsync = ref.watch(_chaptersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Diretórios')),
      body: chaptersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (chapters) => chapters.isEmpty
            ? const Center(child: Text('Sem diretórios'))
            : ListView.builder(
                itemCount: chapters.length,
                itemBuilder: (_, i) =>
                    _ChapterTile(chapter: chapters[i], depth: 0),
              ),
      ),
    );
  }
}

class _ChapterTile extends StatelessWidget {
  final _Chapter chapter;
  final int depth;
  const _ChapterTile({required this.chapter, required this.depth});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: depth * 16.0),
      child: chapter.children.isEmpty
          ? ListTile(
              leading: const Icon(Icons.location_city_outlined),
              title: Text(chapter.name),
              subtitle: Text(chapter.level),
            )
          : ExpansionTile(
              leading: const Icon(Icons.account_balance_outlined),
              title: Text(chapter.name),
              subtitle: Text(chapter.level),
              children: chapter.children
                  .map((c) => _ChapterTile(chapter: c, depth: depth + 1))
                  .toList(),
            ),
    );
  }
}
