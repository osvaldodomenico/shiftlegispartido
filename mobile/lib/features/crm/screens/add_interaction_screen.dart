import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/contacts_provider.dart';

const _interactionTypes = ['call', 'meeting', 'message', 'email', 'event', 'note'];
const _directions = ['outbound', 'inbound'];

class AddInteractionScreen extends ConsumerStatefulWidget {
  final String personId;
  const AddInteractionScreen({super.key, required this.personId});

  @override
  ConsumerState<AddInteractionScreen> createState() =>
      _AddInteractionScreenState();
}

class _AddInteractionScreenState extends ConsumerState<AddInteractionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _summaryCtrl = TextEditingController();
  String _type = 'call';
  String _direction = 'outbound';
  DateTime _occurredAt = DateTime.now();
  bool _loading = false;

  @override
  void dispose() {
    _summaryCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final service = ref.read(crmServiceProvider);
      await service.createInteraction(widget.personId, {
        'type': _type,
        'direction': _direction,
        'summary': _summaryCtrl.text.trim(),
        'occurred_at': _occurredAt.toIso8601String(),
      });
      // Invalida o cache de interações para esse contato
      ref.invalidate(interactionsProvider(widget.personId));
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nova Interação')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Tipo'),
              items: _interactionTypes
                  .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _direction,
              decoration: const InputDecoration(labelText: 'Direção'),
              items: _directions
                  .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                  .toList(),
              onChanged: (v) => setState(() => _direction = v!),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _summaryCtrl,
              decoration: const InputDecoration(labelText: 'Resumo'),
              maxLines: 3,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Campo obrigatório' : null,
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Data/Hora'),
              subtitle: Text(
                '${_occurredAt.day.toString().padLeft(2, '0')}/${_occurredAt.month.toString().padLeft(2, '0')}/${_occurredAt.year} '
                '${_occurredAt.hour.toString().padLeft(2, '0')}:${_occurredAt.minute.toString().padLeft(2, '0')}',
              ),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _occurredAt,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (date != null && mounted) {
                  setState(() => _occurredAt = DateTime(
                      date.year, date.month, date.day,
                      _occurredAt.hour, _occurredAt.minute));
                }
              },
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Salvar'),
            ),
          ],
        ),
      ),
    );
  }
}
