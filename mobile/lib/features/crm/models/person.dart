import 'package:freezed_annotation/freezed_annotation.dart';
import 'tag.dart';
part 'person.freezed.dart';
part 'person.g.dart';

@freezed
class Person with _$Person {
  const factory Person({
    required String id,
    required String name,
    String? email,
    String? phone,
    String? type, // voter, member, leader, donor, volunteer
    String? stage, // pipeline stage
    String? neighborhood,
    String? city,
    String? state,
    @Default([]) List<Tag> tags,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _Person;
  factory Person.fromJson(Map<String, dynamic> json) => _$PersonFromJson(json);
}

@freezed
class PersonListResponse with _$PersonListResponse {
  const factory PersonListResponse({
    required List<Person> data,
    required int total,
    required int page,
    @JsonKey(name: 'per_page') required int perPage,
  }) = _PersonListResponse;
  factory PersonListResponse.fromJson(Map<String, dynamic> json) =>
      _$PersonListResponseFromJson(json);
}
