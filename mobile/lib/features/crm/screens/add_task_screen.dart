import 'package:flutter/material.dart';

// Placeholder — implementado no Chunk 5
class AddTaskScreen extends StatelessWidget {
  final String personId;
  const AddTaskScreen({super.key, required this.personId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Add Task — $personId')));
  }
}
