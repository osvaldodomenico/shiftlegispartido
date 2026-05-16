import 'package:freezed_annotation/freezed_annotation.dart';
part 'schedule_event.freezed.dart';
part 'schedule_event.g.dart';

@freezed
class ScheduleEvent with _$ScheduleEvent {
  const factory ScheduleEvent({
    required String id,
    required String title,
    String? description,
    String? location,
    required String type,
    @JsonKey(name: 'start_at') required DateTime startAt,
    @JsonKey(name: 'end_at') DateTime? endAt,
    @JsonKey(name: 'campaign_id') String? campaignId,
  }) = _ScheduleEvent;
  factory ScheduleEvent.fromJson(Map<String, dynamic> json) =>
      _$ScheduleEventFromJson(json);
}
