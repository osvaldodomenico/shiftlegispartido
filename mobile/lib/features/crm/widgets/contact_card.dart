import 'package:flutter/material.dart';
import '../models/person.dart';

class ContactCard extends StatelessWidget {
  final Person person;
  final VoidCallback? onTap;

  const ContactCard({super.key, required this.person, this.onTap});

  Color _typeColor(BuildContext context, String? type) {
    final cs = Theme.of(context).colorScheme;
    return switch (type) {
      'voter' => Colors.blue.shade400,
      'member' => cs.primary,
      'leader' => Colors.orange.shade600,
      'donor' => Colors.green.shade600,
      'volunteer' => Colors.purple.shade400,
      _ => cs.secondary,
    };
  }

  @override
  Widget build(BuildContext context) {
    final initials = person.name
        .split(' ')
        .take(2)
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() : '')
        .join();
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _typeColor(context, person.type),
          child: Text(initials,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        title: Text(person.name,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          [
            if (person.city != null) person.city,
            if (person.neighborhood != null) person.neighborhood,
          ].join(', '),
          overflow: TextOverflow.ellipsis,
        ),
        trailing: person.type != null
            ? Chip(
                label: Text(person.type!,
                    style: const TextStyle(fontSize: 11)),
                padding: EdgeInsets.zero,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              )
            : null,
        onTap: onTap,
      ),
    );
  }
}
