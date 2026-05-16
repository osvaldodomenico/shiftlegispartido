import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/crm_service.dart';
import '../models/person.dart';
import '../models/interaction.dart';
import '../models/task.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/dio_client.dart';

final crmServiceProvider = Provider<CrmService>((ref) {
  final authService = ref.watch(authServiceProvider);
  final dio = DioClient.getInstance(authService);
  return CrmService(dio);
});

// --- Contacts list ---
class ContactsFilter {
  final String search;
  final String? type;
  ContactsFilter({this.search = '', this.type});
}

final contactsFilterProvider =
    StateProvider<ContactsFilter>((ref) => ContactsFilter());

final contactsProvider = FutureProvider<PersonListResponse>((ref) async {
  final service = ref.watch(crmServiceProvider);
  final filter = ref.watch(contactsFilterProvider);
  return service.getPersons(search: filter.search, type: filter.type);
});

// --- Single contact ---
final contactDetailProvider =
    FutureProvider.family<Person, String>((ref, id) async {
  final service = ref.watch(crmServiceProvider);
  return service.getPerson(id);
});

// --- Interactions ---
final interactionsProvider =
    FutureProvider.family<List<Interaction>, String>((ref, personId) async {
  final service = ref.watch(crmServiceProvider);
  return service.getInteractions(personId);
});

// --- Tasks per person ---
final personTasksProvider =
    FutureProvider.family<List<Task>, String>((ref, personId) async {
  final service = ref.watch(crmServiceProvider);
  return service.getTasks(personId: personId);
});

// --- My tasks ---
final myTasksProvider = FutureProvider<List<Task>>((ref) async {
  final service = ref.watch(crmServiceProvider);
  return service.getTasks(assignedToMe: 'true');
});

// --- Pipeline stage ---
final pipelineStageProvider =
    FutureProvider.family<List<Person>, String>((ref, stage) async {
  final service = ref.watch(crmServiceProvider);
  return service.getPipelineStage(stage);
});
