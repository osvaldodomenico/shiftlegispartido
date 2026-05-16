import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/electoral_service.dart';
import '../models/campaign.dart';
import '../models/schedule_event.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/api/dio_client.dart';

final electoralServiceProvider = Provider<ElectoralService>((ref) {
  final authService = ref.watch(authServiceProvider);
  final dio = DioClient.getInstance(authService);
  return ElectoralService(dio);
});

final campaignsProvider = FutureProvider<List<Campaign>>((ref) async {
  return ref.watch(electoralServiceProvider).getCampaigns();
});

final campaignDetailProvider =
    FutureProvider.family<Campaign, String>((ref, id) async {
  return ref.watch(electoralServiceProvider).getCampaign(id);
});

final campaignScheduleProvider =
    FutureProvider.family<List<ScheduleEvent>, String>((ref, campaignId) async {
  return ref.watch(electoralServiceProvider).getSchedule(campaignId);
});
