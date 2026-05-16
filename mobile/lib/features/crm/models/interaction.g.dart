// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'interaction.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$InteractionImpl _$$InteractionImplFromJson(Map<String, dynamic> json) =>
    _$InteractionImpl(
      id: json['id'] as String,
      personId: json['person_id'] as String,
      type: json['type'] as String,
      direction: json['direction'] as String,
      summary: json['summary'] as String,
      occurredAt: DateTime.parse(json['occurred_at'] as String),
      createdByName: json['created_by_name'] as String?,
    );

Map<String, dynamic> _$$InteractionImplToJson(_$InteractionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'person_id': instance.personId,
      'type': instance.type,
      'direction': instance.direction,
      'summary': instance.summary,
      'occurred_at': instance.occurredAt.toIso8601String(),
      'created_by_name': instance.createdByName,
    };
