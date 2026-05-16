import 'package:freezed_annotation/freezed_annotation.dart';
part 'campaign.freezed.dart';
part 'campaign.g.dart';

@freezed
class Campaign with _$Campaign {
  const factory Campaign({
    required String id,
    required String name,
    required String status, // planning, active, completed, cancelled
    String? position, // vereador, deputado_estadual, etc
    @JsonKey(name: 'candidate_name') String? candidateName,
    @JsonKey(name: 'election_date') DateTime? electionDate,
    @JsonKey(name: 'budget_limit') double? budgetLimit,
    @JsonKey(name: 'budget_spent') double? budgetSpent,
    @Default([]) List<CampaignMember> team,
  }) = _Campaign;
  factory Campaign.fromJson(Map<String, dynamic> json) =>
      _$CampaignFromJson(json);
}

@freezed
class CampaignMember with _$CampaignMember {
  const factory CampaignMember({
    required String id,
    required String name,
    required String role,
  }) = _CampaignMember;
  factory CampaignMember.fromJson(Map<String, dynamic> json) =>
      _$CampaignMemberFromJson(json);
}
