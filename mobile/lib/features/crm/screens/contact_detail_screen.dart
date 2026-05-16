import 'package:flutter/material.dart';

// Placeholder — implementado no Chunk 4
class ContactDetailScreen extends StatelessWidget {
  final String personId;
  const ContactDetailScreen({super.key, required this.personId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Contact $personId')));
  }
}
