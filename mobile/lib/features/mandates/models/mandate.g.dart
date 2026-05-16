// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mandate.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$MandateImpl _$$MandateImplFromJson(Map<String, dynamic> json) =>
    _$MandateImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      holderName: json['holder_name'] as String?,
      level: json['level'] as String,
      status: json['status'] as String,
      startDate: json['start_date'] == null
          ? null
          : DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] == null
          ? null
          : DateTime.parse(json['end_date'] as String),
    );

Map<String, dynamic> _$$MandateImplToJson(_$MandateImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'holder_name': instance.holderName,
      'level': instance.level,
      'status': instance.status,
      'start_date': instance.startDate?.toIso8601String(),
      'end_date': instance.endDate?.toIso8601String(),
    };
