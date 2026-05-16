// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'mandate.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Mandate _$MandateFromJson(Map<String, dynamic> json) {
  return _Mandate.fromJson(json);
}

/// @nodoc
mixin _$Mandate {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'holder_name')
  String? get holderName => throw _privateConstructorUsedError;
  String get level =>
      throw _privateConstructorUsedError; // federal, estadual, municipal
  String get status =>
      throw _privateConstructorUsedError; // active, completed, cancelled
  @JsonKey(name: 'start_date')
  DateTime? get startDate => throw _privateConstructorUsedError;
  @JsonKey(name: 'end_date')
  DateTime? get endDate => throw _privateConstructorUsedError;

  /// Serializes this Mandate to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Mandate
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MandateCopyWith<Mandate> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MandateCopyWith<$Res> {
  factory $MandateCopyWith(Mandate value, $Res Function(Mandate) then) =
      _$MandateCopyWithImpl<$Res, Mandate>;
  @useResult
  $Res call(
      {String id,
      String title,
      String? description,
      @JsonKey(name: 'holder_name') String? holderName,
      String level,
      String status,
      @JsonKey(name: 'start_date') DateTime? startDate,
      @JsonKey(name: 'end_date') DateTime? endDate});
}

/// @nodoc
class _$MandateCopyWithImpl<$Res, $Val extends Mandate>
    implements $MandateCopyWith<$Res> {
  _$MandateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Mandate
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = freezed,
    Object? holderName = freezed,
    Object? level = null,
    Object? status = null,
    Object? startDate = freezed,
    Object? endDate = freezed,
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
      holderName: freezed == holderName
          ? _value.holderName
          : holderName // ignore: cast_nullable_to_non_nullable
              as String?,
      level: null == level
          ? _value.level
          : level // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MandateImplCopyWith<$Res> implements $MandateCopyWith<$Res> {
  factory _$$MandateImplCopyWith(
          _$MandateImpl value, $Res Function(_$MandateImpl) then) =
      __$$MandateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String? description,
      @JsonKey(name: 'holder_name') String? holderName,
      String level,
      String status,
      @JsonKey(name: 'start_date') DateTime? startDate,
      @JsonKey(name: 'end_date') DateTime? endDate});
}

/// @nodoc
class __$$MandateImplCopyWithImpl<$Res>
    extends _$MandateCopyWithImpl<$Res, _$MandateImpl>
    implements _$$MandateImplCopyWith<$Res> {
  __$$MandateImplCopyWithImpl(
      _$MandateImpl _value, $Res Function(_$MandateImpl) _then)
      : super(_value, _then);

  /// Create a copy of Mandate
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = freezed,
    Object? holderName = freezed,
    Object? level = null,
    Object? status = null,
    Object? startDate = freezed,
    Object? endDate = freezed,
  }) {
    return _then(_$MandateImpl(
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
      holderName: freezed == holderName
          ? _value.holderName
          : holderName // ignore: cast_nullable_to_non_nullable
              as String?,
      level: null == level
          ? _value.level
          : level // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MandateImpl implements _Mandate {
  const _$MandateImpl(
      {required this.id,
      required this.title,
      this.description,
      @JsonKey(name: 'holder_name') this.holderName,
      required this.level,
      required this.status,
      @JsonKey(name: 'start_date') this.startDate,
      @JsonKey(name: 'end_date') this.endDate});

  factory _$MandateImpl.fromJson(Map<String, dynamic> json) =>
      _$$MandateImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String? description;
  @override
  @JsonKey(name: 'holder_name')
  final String? holderName;
  @override
  final String level;
// federal, estadual, municipal
  @override
  final String status;
// active, completed, cancelled
  @override
  @JsonKey(name: 'start_date')
  final DateTime? startDate;
  @override
  @JsonKey(name: 'end_date')
  final DateTime? endDate;

  @override
  String toString() {
    return 'Mandate(id: $id, title: $title, description: $description, holderName: $holderName, level: $level, status: $status, startDate: $startDate, endDate: $endDate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MandateImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.holderName, holderName) ||
                other.holderName == holderName) &&
            (identical(other.level, level) || other.level == level) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, title, description,
      holderName, level, status, startDate, endDate);

  /// Create a copy of Mandate
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MandateImplCopyWith<_$MandateImpl> get copyWith =>
      __$$MandateImplCopyWithImpl<_$MandateImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MandateImplToJson(
      this,
    );
  }
}

abstract class _Mandate implements Mandate {
  const factory _Mandate(
      {required final String id,
      required final String title,
      final String? description,
      @JsonKey(name: 'holder_name') final String? holderName,
      required final String level,
      required final String status,
      @JsonKey(name: 'start_date') final DateTime? startDate,
      @JsonKey(name: 'end_date') final DateTime? endDate}) = _$MandateImpl;

  factory _Mandate.fromJson(Map<String, dynamic> json) = _$MandateImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String? get description;
  @override
  @JsonKey(name: 'holder_name')
  String? get holderName;
  @override
  String get level; // federal, estadual, municipal
  @override
  String get status; // active, completed, cancelled
  @override
  @JsonKey(name: 'start_date')
  DateTime? get startDate;
  @override
  @JsonKey(name: 'end_date')
  DateTime? get endDate;

  /// Create a copy of Mandate
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MandateImplCopyWith<_$MandateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
