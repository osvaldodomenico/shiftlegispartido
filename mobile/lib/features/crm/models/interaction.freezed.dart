// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'interaction.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Interaction _$InteractionFromJson(Map<String, dynamic> json) {
  return _Interaction.fromJson(json);
}

/// @nodoc
mixin _$Interaction {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'person_id')
  String get personId => throw _privateConstructorUsedError;
  String get type =>
      throw _privateConstructorUsedError; // call, meeting, message, email, event, note
  String get direction =>
      throw _privateConstructorUsedError; // inbound, outbound
  String get summary => throw _privateConstructorUsedError;
  @JsonKey(name: 'occurred_at')
  DateTime get occurredAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'created_by_name')
  String? get createdByName => throw _privateConstructorUsedError;

  /// Serializes this Interaction to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Interaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $InteractionCopyWith<Interaction> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InteractionCopyWith<$Res> {
  factory $InteractionCopyWith(
          Interaction value, $Res Function(Interaction) then) =
      _$InteractionCopyWithImpl<$Res, Interaction>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'person_id') String personId,
      String type,
      String direction,
      String summary,
      @JsonKey(name: 'occurred_at') DateTime occurredAt,
      @JsonKey(name: 'created_by_name') String? createdByName});
}

/// @nodoc
class _$InteractionCopyWithImpl<$Res, $Val extends Interaction>
    implements $InteractionCopyWith<$Res> {
  _$InteractionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Interaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? personId = null,
    Object? type = null,
    Object? direction = null,
    Object? summary = null,
    Object? occurredAt = null,
    Object? createdByName = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      personId: null == personId
          ? _value.personId
          : personId // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      direction: null == direction
          ? _value.direction
          : direction // ignore: cast_nullable_to_non_nullable
              as String,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      occurredAt: null == occurredAt
          ? _value.occurredAt
          : occurredAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      createdByName: freezed == createdByName
          ? _value.createdByName
          : createdByName // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InteractionImplCopyWith<$Res>
    implements $InteractionCopyWith<$Res> {
  factory _$$InteractionImplCopyWith(
          _$InteractionImpl value, $Res Function(_$InteractionImpl) then) =
      __$$InteractionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'person_id') String personId,
      String type,
      String direction,
      String summary,
      @JsonKey(name: 'occurred_at') DateTime occurredAt,
      @JsonKey(name: 'created_by_name') String? createdByName});
}

/// @nodoc
class __$$InteractionImplCopyWithImpl<$Res>
    extends _$InteractionCopyWithImpl<$Res, _$InteractionImpl>
    implements _$$InteractionImplCopyWith<$Res> {
  __$$InteractionImplCopyWithImpl(
      _$InteractionImpl _value, $Res Function(_$InteractionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Interaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? personId = null,
    Object? type = null,
    Object? direction = null,
    Object? summary = null,
    Object? occurredAt = null,
    Object? createdByName = freezed,
  }) {
    return _then(_$InteractionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      personId: null == personId
          ? _value.personId
          : personId // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      direction: null == direction
          ? _value.direction
          : direction // ignore: cast_nullable_to_non_nullable
              as String,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      occurredAt: null == occurredAt
          ? _value.occurredAt
          : occurredAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      createdByName: freezed == createdByName
          ? _value.createdByName
          : createdByName // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InteractionImpl implements _Interaction {
  const _$InteractionImpl(
      {required this.id,
      @JsonKey(name: 'person_id') required this.personId,
      required this.type,
      required this.direction,
      required this.summary,
      @JsonKey(name: 'occurred_at') required this.occurredAt,
      @JsonKey(name: 'created_by_name') this.createdByName});

  factory _$InteractionImpl.fromJson(Map<String, dynamic> json) =>
      _$$InteractionImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'person_id')
  final String personId;
  @override
  final String type;
// call, meeting, message, email, event, note
  @override
  final String direction;
// inbound, outbound
  @override
  final String summary;
  @override
  @JsonKey(name: 'occurred_at')
  final DateTime occurredAt;
  @override
  @JsonKey(name: 'created_by_name')
  final String? createdByName;

  @override
  String toString() {
    return 'Interaction(id: $id, personId: $personId, type: $type, direction: $direction, summary: $summary, occurredAt: $occurredAt, createdByName: $createdByName)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InteractionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.personId, personId) ||
                other.personId == personId) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.direction, direction) ||
                other.direction == direction) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            (identical(other.occurredAt, occurredAt) ||
                other.occurredAt == occurredAt) &&
            (identical(other.createdByName, createdByName) ||
                other.createdByName == createdByName));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, personId, type, direction,
      summary, occurredAt, createdByName);

  /// Create a copy of Interaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InteractionImplCopyWith<_$InteractionImpl> get copyWith =>
      __$$InteractionImplCopyWithImpl<_$InteractionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InteractionImplToJson(
      this,
    );
  }
}

abstract class _Interaction implements Interaction {
  const factory _Interaction(
          {required final String id,
          @JsonKey(name: 'person_id') required final String personId,
          required final String type,
          required final String direction,
          required final String summary,
          @JsonKey(name: 'occurred_at') required final DateTime occurredAt,
          @JsonKey(name: 'created_by_name') final String? createdByName}) =
      _$InteractionImpl;

  factory _Interaction.fromJson(Map<String, dynamic> json) =
      _$InteractionImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'person_id')
  String get personId;
  @override
  String get type; // call, meeting, message, email, event, note
  @override
  String get direction; // inbound, outbound
  @override
  String get summary;
  @override
  @JsonKey(name: 'occurred_at')
  DateTime get occurredAt;
  @override
  @JsonKey(name: 'created_by_name')
  String? get createdByName;

  /// Create a copy of Interaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InteractionImplCopyWith<_$InteractionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
