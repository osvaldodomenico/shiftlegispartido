import 'package:dio/dio.dart';
import '../models/campaign.dart';
import '../models/schedule_event.dart';
import '../../../core/api/api_exception.dart';

class ElectoralService {
  final Dio _dio;
  ElectoralService(this._dio);

  Future<List<Campaign>> getCampaigns() async {
    try {
      final response = await _dio.get('/electoral/campaigns');
      final list = response.data['data'] as List;
      return list.map((e) => Campaign.fromJson(e)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Campaign> getCampaign(String id) async {
    try {
      final response = await _dio.get('/electoral/campaigns/$id');
      return Campaign.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<ScheduleEvent>> getSchedule(String campaignId) async {
    try {
      final response =
          await _dio.get('/electoral/campaigns/$campaignId/schedule');
      final list = response.data['data'] as List;
      return list.map((e) => ScheduleEvent.fromJson(e)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
