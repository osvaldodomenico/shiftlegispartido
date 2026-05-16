import 'package:freezed_annotation/freezed_annotation.dart';
part 'interaction.freezed.dart';
part 'interaction.g.dart';

@freezed
class Interaction with _$Interaction {
  const factory Interaction({
    required String id,
    @JsonKey(name: 'person_id') required String personId,
    required String type, // call, meeting, message, email, event, note
    required String direction, // inbound, outbound
    required String summary,
    @JsonKey(name: 'occurred_at') required DateTime occurredAt,
    @JsonKey(name: 'created_by_name') String? createdByName,
  }) = _Interaction;
  factory Interaction.fromJson(Map<String, dynamic> json) =>
      _$InteractionFromJson(json);
}
