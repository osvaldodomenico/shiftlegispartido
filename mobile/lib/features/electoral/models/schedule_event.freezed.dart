// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'schedule_event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ScheduleEvent _$ScheduleEventFromJson(Map<String, dynamic> json) {
  return _ScheduleEvent.fromJson(json);
}

/// @nodoc
mixin _$ScheduleEvent {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get location => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  @JsonKey(name: 'start_at')
  DateTime get startAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'end_at')
  DateTime? get endAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'campaign_id')
  String? get campaignId => throw _privateConstructorUsedError;

  /// Serializes this ScheduleEvent to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ScheduleEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ScheduleEventCopyWith<ScheduleEvent> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ScheduleEventCopyWith<$Res> {
  factory $ScheduleEventCopyWith(
          ScheduleEvent value, $Res Function(ScheduleEvent) then) =
      _$ScheduleEventCopyWithImpl<$Res, ScheduleEvent>;
  @useResult
  $Res call(
      {String id,
      String title,
      String? description,
      String? location,
      String type,
      @JsonKey(name: 'start_at') DateTime startAt,
      @JsonKey(name: 'end_at') DateTime? endAt,
      @JsonKey(name: 'campaign_id') String? campaignId});
}

/// @nodoc
class _$ScheduleEventCopyWithImpl<$Res, $Val extends ScheduleEvent>
    implements $ScheduleEventCopyWith<$Res> {
  _$ScheduleEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ScheduleEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = freezed,
    Object? location = freezed,
    Object? type = null,
    Object? startAt = null,
    Object? endAt = freezed,
    Object? campaignId = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      startAt: null == startAt
          ? _value.startAt
          : startAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endAt: freezed == endAt
          ? _value.endAt
          : endAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      campaignId: freezed == campaignId
          ? _value.campaignId
          : campaignId // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ScheduleEventImplCopyWith<$Res>
    implements $ScheduleEventCopyWith<$Res> {
  factory _$$ScheduleEventImplCopyWith(
          _$ScheduleEventImpl value, $Res Function(_$ScheduleEventImpl) then) =
      __$$ScheduleEventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String? description,
      String? location,
      String type,
      @JsonKey(name: 'start_at') DateTime startAt,
      @JsonKey(name: 'end_at') DateTime? endAt,
      @JsonKey(name: 'campaign_id') String? campaignId});
}

/// @nodoc
class __$$ScheduleEventImplCopyWithImpl<$Res>
    extends _$ScheduleEventCopyWithImpl<$Res, _$ScheduleEventImpl>
    implements _$$ScheduleEventImplCopyWith<$Res> {
  __$$ScheduleEventImplCopyWithImpl(
      _$ScheduleEventImpl _value, $Res Function(_$ScheduleEventImpl) _then)
      : super(_value, _then);

  /// Create a copy of ScheduleEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = freezed,
    Object? location = freezed,
    Object? type = null,
    Object? startAt = null,
    Object? endAt = freezed,
    Object? campaignId = freezed,
  }) {
    return _then(_$ScheduleEventImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      startAt: null == startAt
          ? _value.startAt
          : startAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endAt: freezed == endAt
          ? _value.endAt
          : endAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      campaignId: freezed == campaignId
          ? _value.campaignId
          : campaignId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ScheduleEventImpl implements _ScheduleEvent {
  const _$ScheduleEventImpl(
      {required this.id,
      required this.title,
      this.description,
      this.location,
      required this.type,
      @JsonKey(name: 'start_at') required this.startAt,
      @JsonKey(name: 'end_at') this.endAt,
      @JsonKey(name: 'campaign_id') this.campaignId});

  factory _$ScheduleEventImpl.fromJson(Map<String, dynamic> json) =>
      _$$ScheduleEventImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String? description;
  @override
  final String? location;
  @override
  final String type;
  @override
  @JsonKey(name: 'start_at')
  final DateTime startAt;
  @override
  @JsonKey(name: 'end_at')
  final DateTime? endAt;
  @override
  @JsonKey(name: 'campaign_id')
  final String? campaignId;

  @override
  String toString() {
    return 'ScheduleEvent(id: $id, title: $title, description: $description, location: $location, type: $type, startAt: $startAt, endAt: $endAt, campaignId: $campaignId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ScheduleEventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.startAt, startAt) || other.startAt == startAt) &&
            (identical(other.endAt, endAt) || other.endAt == endAt) &&
            (identical(other.campaignId, campaignId) ||
                other.campaignId == campaignId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, title, description, location,
      type, startAt, endAt, campaignId);

  /// Create a copy of ScheduleEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ScheduleEventImplCopyWith<_$ScheduleEventImpl> get copyWith =>
      __$$ScheduleEventImplCopyWithImpl<_$ScheduleEventImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ScheduleEventImplToJson(
      this,
    );
  }
}

abstract class _ScheduleEvent implements ScheduleEvent {
  const factory _ScheduleEvent(
          {required final String id,
          required final String title,
          final String? description,
          final String? location,
          required final String type,
          @JsonKey(name: 'start_at') required final DateTime startAt,
          @JsonKey(name: 'end_at') final DateTime? endAt,
          @JsonKey(name: 'campaign_id') final String? campaignId}) =
      _$ScheduleEventImpl;

  factory _ScheduleEvent.fromJson(Map<String, dynamic> json) =
      _$ScheduleEventImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String? get description;
  @override
  String? get location;
  @override
  String get type;
  @override
  @JsonKey(name: 'start_at')
  DateTime get startAt;
  @override
  @JsonKey(name: 'end_at')
  DateTime? get endAt;
  @override
  @JsonKey(name: 'campaign_id')
  String? get campaignId;

  /// Create a copy of ScheduleEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ScheduleEventImplCopyWith<_$ScheduleEventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
