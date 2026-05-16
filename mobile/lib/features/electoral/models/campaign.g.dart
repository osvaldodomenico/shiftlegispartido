// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'campaign.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CampaignImpl _$$CampaignImplFromJson(Map<String, dynamic> json) =>
    _$CampaignImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
      position: json['position'] as String?,
      candidateName: json['candidate_name'] as String?,
      electionDate: json['election_date'] == null
          ? null
          : DateTime.parse(json['election_date'] as String),
      budgetLimit: (json['budget_limit'] as num?)?.toDouble(),
      budgetSpent: (json['budget_spent'] as num?)?.toDouble(),
      team: (json['team'] as List<dynamic>?)
              ?.map((e) => CampaignMember.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$CampaignImplToJson(_$CampaignImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'status': instance.status,
      'position': instance.position,
      'candidate_name': instance.candidateName,
      'election_date': instance.electionDate?.toIso8601String(),
      'budget_limit': instance.budgetLimit,
      'budget_spent': instance.budgetSpent,
      'team': instance.team,
    };

_$CampaignMemberImpl _$$CampaignMemberImplFromJson(Map<String, dynamic> json) =>
    _$CampaignMemberImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
    );

Map<String, dynamic> _$$CampaignMemberImplToJson(
        _$CampaignMemberImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'role': instance.role,
    };
