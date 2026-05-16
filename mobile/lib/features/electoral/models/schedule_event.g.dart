// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'schedule_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ScheduleEventImpl _$$ScheduleEventImplFromJson(Map<String, dynamic> json) =>
    _$ScheduleEventImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      location: json['location'] as String?,
      type: json['type'] as String,
      startAt: DateTime.parse(json['start_at'] as String),
      endAt: json['end_at'] == null
          ? null
          : DateTime.parse(json['end_at'] as String),
      campaignId: json['campaign_id'] as String?,
    );

Map<String, dynamic> _$$ScheduleEventImplToJson(_$ScheduleEventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'location': instance.location,
      'type': instance.type,
      'start_at': instance.startAt.toIso8601String(),
      'end_at': instance.endAt?.toIso8601String(),
      'campaign_id': instance.campaignId,
    };
