// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'campaign.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Campaign _$CampaignFromJson(Map<String, dynamic> json) {
  return _Campaign.fromJson(json);
}

/// @nodoc
mixin _$Campaign {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get status =>
      throw _privateConstructorUsedError; // planning, active, completed, cancelled
  String? get position =>
      throw _privateConstructorUsedError; // vereador, deputado_estadual, etc
  @JsonKey(name: 'candidate_name')
  String? get candidateName => throw _privateConstructorUsedError;
  @JsonKey(name: 'election_date')
  DateTime? get electionDate => throw _privateConstructorUsedError;
  @JsonKey(name: 'budget_limit')
  double? get budgetLimit => throw _privateConstructorUsedError;
  @JsonKey(name: 'budget_spent')
  double? get budgetSpent => throw _privateConstructorUsedError;
  List<CampaignMember> get team => throw _privateConstructorUsedError;

  /// Serializes this Campaign to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Campaign
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CampaignCopyWith<Campaign> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CampaignCopyWith<$Res> {
  factory $CampaignCopyWith(Campaign value, $Res Function(Campaign) then) =
      _$CampaignCopyWithImpl<$Res, Campaign>;
  @useResult
  $Res call(
      {String id,
      String name,
      String status,
      String? position,
      @JsonKey(name: 'candidate_name') String? candidateName,
      @JsonKey(name: 'election_date') DateTime? electionDate,
      @JsonKey(name: 'budget_limit') double? budgetLimit,
      @JsonKey(name: 'budget_spent') double? budgetSpent,
      List<CampaignMember> team});
}

/// @nodoc
class _$CampaignCopyWithImpl<$Res, $Val extends Campaign>
    implements $CampaignCopyWith<$Res> {
  _$CampaignCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Campaign
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? status = null,
    Object? position = freezed,
    Object? candidateName = freezed,
    Object? electionDate = freezed,
    Object? budgetLimit = freezed,
    Object? budgetSpent = freezed,
    Object? team = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      position: freezed == position
          ? _value.position
          : position // ignore: cast_nullable_to_non_nullable
              as String?,
      candidateName: freezed == candidateName
          ? _value.candidateName
          : candidateName // ignore: cast_nullable_to_non_nullable
              as String?,
      electionDate: freezed == electionDate
          ? _value.electionDate
          : electionDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      budgetLimit: freezed == budgetLimit
          ? _value.budgetLimit
          : budgetLimit // ignore: cast_nullable_to_non_nullable
              as double?,
      budgetSpent: freezed == budgetSpent
          ? _value.budgetSpent
          : budgetSpent // ignore: cast_nullable_to_non_nullable
              as double?,
      team: null == team
          ? _value.team
          : team // ignore: cast_nullable_to_non_nullable
              as List<CampaignMember>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CampaignImplCopyWith<$Res>
    implements $CampaignCopyWith<$Res> {
  factory _$$CampaignImplCopyWith(
          _$CampaignImpl value, $Res Function(_$CampaignImpl) then) =
      __$$CampaignImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      String status,
      String? position,
      @JsonKey(name: 'candidate_name') String? candidateName,
      @JsonKey(name: 'election_date') DateTime? electionDate,
      @JsonKey(name: 'budget_limit') double? budgetLimit,
      @JsonKey(name: 'budget_spent') double? budgetSpent,
      List<CampaignMember> team});
}

/// @nodoc
class __$$CampaignImplCopyWithImpl<$Res>
    extends _$CampaignCopyWithImpl<$Res, _$CampaignImpl>
    implements _$$CampaignImplCopyWith<$Res> {
  __$$CampaignImplCopyWithImpl(
      _$CampaignImpl _value, $Res Function(_$CampaignImpl) _then)
      : super(_value, _then);

  /// Create a copy of Campaign
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? status = null,
    Object? position = freezed,
    Object? candidateName = freezed,
    Object? electionDate = freezed,
    Object? budgetLimit = freezed,
    Object? budgetSpent = freezed,
    Object? team = null,
  }) {
    return _then(_$CampaignImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      position: freezed == position
          ? _value.position
          : position // ignore: cast_nullable_to_non_nullable
              as String?,
      candidateName: freezed == candidateName
          ? _value.candidateName
          : candidateName // ignore: cast_nullable_to_non_nullable
              as String?,
      electionDate: freezed == electionDate
          ? _value.electionDate
          : electionDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      budgetLimit: freezed == budgetLimit
          ? _value.budgetLimit
          : budgetLimit // ignore: cast_nullable_to_non_nullable
              as double?,
      budgetSpent: freezed == budgetSpent
          ? _value.budgetSpent
          : budgetSpent // ignore: cast_nullable_to_non_nullable
              as double?,
      team: null == team
          ? _value._team
          : team // ignore: cast_nullable_to_non_nullable
              as List<CampaignMember>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CampaignImpl implements _Campaign {
  const _$CampaignImpl(
      {required this.id,
      required this.name,
      required this.status,
      this.position,
      @JsonKey(name: 'candidate_name') this.candidateName,
      @JsonKey(name: 'election_date') this.electionDate,
      @JsonKey(name: 'budget_limit') this.budgetLimit,
      @JsonKey(name: 'budget_spent') this.budgetSpent,
      final List<CampaignMember> team = const []})
      : _team = team;

  factory _$CampaignImpl.fromJson(Map<String, dynamic> json) =>
      _$$CampaignImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String status;
// planning, active, completed, cancelled
  @override
  final String? position;
// vereador, deputado_estadual, etc
  @override
  @JsonKey(name: 'candidate_name')
  final String? candidateName;
  @override
  @JsonKey(name: 'election_date')
  final DateTime? electionDate;
  @override
  @JsonKey(name: 'budget_limit')
  final double? budgetLimit;
  @override
  @JsonKey(name: 'budget_spent')
  final double? budgetSpent;
  final List<CampaignMember> _team;
  @override
  @JsonKey()
  List<CampaignMember> get team {
    if (_team is EqualUnmodifiableListView) return _team;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_team);
  }

  @override
  String toString() {
    return 'Campaign(id: $id, name: $name, status: $status, position: $position, candidateName: $candidateName, electionDate: $electionDate, budgetLimit: $budgetLimit, budgetSpent: $budgetSpent, team: $team)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CampaignImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.position, position) ||
                other.position == position) &&
            (identical(other.candidateName, candidateName) ||
                other.candidateName == candidateName) &&
            (identical(other.electionDate, electionDate) ||
                other.electionDate == electionDate) &&
            (identical(other.budgetLimit, budgetLimit) ||
                other.budgetLimit == budgetLimit) &&
            (identical(other.budgetSpent, budgetSpent) ||
                other.budgetSpent == budgetSpent) &&
            const DeepCollectionEquality().equals(other._team, _team));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      name,
      status,
      position,
      candidateName,
      electionDate,
      budgetLimit,
      budgetSpent,
      const DeepCollectionEquality().hash(_team));

  /// Create a copy of Campaign
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CampaignImplCopyWith<_$CampaignImpl> get copyWith =>
      __$$CampaignImplCopyWithImpl<_$CampaignImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CampaignImplToJson(
      this,
    );
  }
}

abstract class _Campaign implements Campaign {
  const factory _Campaign(
      {required final String id,
      required final String name,
      required final String status,
      final String? position,
      @JsonKey(name: 'candidate_name') final String? candidateName,
      @JsonKey(name: 'election_date') final DateTime? electionDate,
      @JsonKey(name: 'budget_limit') final double? budgetLimit,
      @JsonKey(name: 'budget_spent') final double? budgetSpent,
      final List<CampaignMember> team}) = _$CampaignImpl;

  factory _Campaign.fromJson(Map<String, dynamic> json) =
      _$CampaignImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get status; // planning, active, completed, cancelled
  @override
  String? get position; // vereador, deputado_estadual, etc
  @override
  @JsonKey(name: 'candidate_name')
  String? get candidateName;
  @override
  @JsonKey(name: 'election_date')
  DateTime? get electionDate;
  @override
  @JsonKey(name: 'budget_limit')
  double? get budgetLimit;
  @override
  @JsonKey(name: 'budget_spent')
  double? get budgetSpent;
  @override
  List<CampaignMember> get team;

  /// Create a copy of Campaign
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CampaignImplCopyWith<_$CampaignImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CampaignMember _$CampaignMemberFromJson(Map<String, dynamic> json) {
  return _CampaignMember.fromJson(json);
}

/// @nodoc
mixin _$CampaignMember {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;

  /// Serializes this CampaignMember to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CampaignMember
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CampaignMemberCopyWith<CampaignMember> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CampaignMemberCopyWith<$Res> {
  factory $CampaignMemberCopyWith(
          CampaignMember value, $Res Function(CampaignMember) then) =
      _$CampaignMemberCopyWithImpl<$Res, CampaignMember>;
  @useResult
  $Res call({String id, String name, String role});
}

/// @nodoc
class _$CampaignMemberCopyWithImpl<$Res, $Val extends CampaignMember>
    implements $CampaignMemberCopyWith<$Res> {
  _$CampaignMemberCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CampaignMember
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? role = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CampaignMemberImplCopyWith<$Res>
    implements $CampaignMemberCopyWith<$Res> {
  factory _$$CampaignMemberImplCopyWith(_$CampaignMemberImpl value,
          $Res Function(_$CampaignMemberImpl) then) =
      __$$CampaignMemberImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String role});
}

/// @nodoc
class __$$CampaignMemberImplCopyWithImpl<$Res>
    extends _$CampaignMemberCopyWithImpl<$Res, _$CampaignMemberImpl>
    implements _$$CampaignMemberImplCopyWith<$Res> {
  __$$CampaignMemberImplCopyWithImpl(
      _$CampaignMemberImpl _value, $Res Function(_$CampaignMemberImpl) _then)
      : super(_value, _then);

  /// Create a copy of CampaignMember
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? role = null,
  }) {
    return _then(_$CampaignMemberImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CampaignMemberImpl implements _CampaignMember {
  const _$CampaignMemberImpl(
      {required this.id, required this.name, required this.role});

  factory _$CampaignMemberImpl.fromJson(Map<String, dynamic> json) =>
      _$$CampaignMemberImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String role;

  @override
  String toString() {
    return 'CampaignMember(id: $id, name: $name, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CampaignMemberImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, role);

  /// Create a copy of CampaignMember
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CampaignMemberImplCopyWith<_$CampaignMemberImpl> get copyWith =>
      __$$CampaignMemberImplCopyWithImpl<_$CampaignMemberImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CampaignMemberImplToJson(
      this,
    );
  }
}

abstract class _CampaignMember implements CampaignMember {
  const factory _CampaignMember(
      {required final String id,
      required final String name,
      required final String role}) = _$CampaignMemberImpl;

  factory _CampaignMember.fromJson(Map<String, dynamic> json) =
      _$CampaignMemberImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get role;

  /// Create a copy of CampaignMember
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CampaignMemberImplCopyWith<_$CampaignMemberImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
