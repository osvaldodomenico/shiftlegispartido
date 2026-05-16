import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBottomNavBar extends StatelessWidget {
  final int currentIndex;
  const AppBottomNavBar({super.key, required this.currentIndex});

  static const _routes = ['/home', '/contacts', '/tasks', '/pipeline', '/campaigns'];

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: (i) => context.go(_routes[i]),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: 'Início',
        ),
        NavigationDestination(
          icon: Icon(Icons.people_outlined),
          selectedIcon: Icon(Icons.people),
          label: 'Contatos',
        ),
        NavigationDestination(
          icon: Icon(Icons.task_outlined),
          selectedIcon: Icon(Icons.task),
          label: 'Tarefas',
        ),
        NavigationDestination(
          icon: Icon(Icons.account_tree_outlined),
          selectedIcon: Icon(Icons.account_tree),
          label: 'Pipeline',
        ),
        NavigationDestination(
          icon: Icon(Icons.campaign_outlined),
          selectedIcon: Icon(Icons.campaign),
          label: 'Campanhas',
        ),
      ],
    );
  }
}
