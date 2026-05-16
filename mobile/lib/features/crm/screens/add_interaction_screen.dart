import 'package:flutter/material.dart';

// Placeholder — implementado no Chunk 5
class AddInteractionScreen extends StatelessWidget {
  final String personId;
  const AddInteractionScreen({super.key, required this.personId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Add Interaction — $personId')));
  }
}
