import 'package:dio/dio.dart';
import '../models/person.dart';
import '../models/interaction.dart';
import '../models/task.dart';
import '../models/tag.dart';
import '../../../core/api/api_exception.dart';

class CrmService {
  final Dio _dio;
  CrmService(this._dio);

  // --- Persons ---
  Future<PersonListResponse> getPersons({
    int page = 1,
    int perPage = 20,
    String? search,
    String? type,
    String? stage,
  }) async {
    try {
      final response = await _dio.get('/crm/persons', queryParameters: {
        'page': page,
        'per_page': perPage,
        if (search != null && search.isNotEmpty) 'search': search,
        if (type != null) 'type': type,
        if (stage != null) 'stage': stage,
      });
      return PersonListResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Person> getPerson(String id) async {
    try {
      final response = await _dio.get('/crm/persons/$id');
      return Person.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // --- Interactions ---
  Future<List<Interaction>> getInteractions(String personId) async {
    try {
      final response = await _dio.get('/crm/persons/$personId/interactions');
      final list = response.data['data'] as List;
      return list.map((e) => Interaction.fromJson(e)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Interaction> createInteraction(
      String personId, Map<String, dynamic> body) async {
    try {
      final response =
          await _dio.post('/crm/persons/$personId/interactions', data: body);
      return Interaction.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // --- Tasks ---
  Future<List<Task>> getTasks({String? personId, String? assignedToMe}) async {
    try {
      final response = await _dio.get('/crm/tasks', queryParameters: {
        if (personId != null) 'person_id': personId,
        if (assignedToMe != null) 'assigned_to_me': assignedToMe,
      });
      final list = response.data['data'] as List;
      return list.map((e) => Task.fromJson(e)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Task> createTask(Map<String, dynamic> body) async {
    try {
      final response = await _dio.post('/crm/tasks', data: body);
      return Task.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Task> updateTaskStatus(String taskId, String status) async {
    try {
      final response =
          await _dio.patch('/crm/tasks/$taskId', data: {'status': status});
      return Task.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // --- Tags ---
  Future<List<Tag>> getTags() async {
    try {
      final response = await _dio.get('/crm/tags');
      final list = response.data['data'] as List;
      return list.map((e) => Tag.fromJson(e)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> addTagToPerson(String personId, String tagId) async {
    try {
      await _dio.post('/crm/persons/$personId/tags', data: {'tag_id': tagId});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> removeTagFromPerson(String personId, String tagId) async {
    try {
      await _dio.delete('/crm/persons/$personId/tags/$tagId');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  // --- Pipeline ---
  Future<List<Person>> getPipelineStage(String stage) async {
    try {
      final response = await _dio.get('/crm/persons',
          queryParameters: {'stage': stage, 'per_page': 100});
      final list = response.data['data']['data'] as List;
      return list.map((e) => Person.fromJson(e)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updatePersonStage(String personId, String stage) async {
    try {
      await _dio.patch('/crm/persons/$personId', data: {'stage': stage});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
