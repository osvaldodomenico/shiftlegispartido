import 'package:freezed_annotation/freezed_annotation.dart';
part 'mandate.freezed.dart';
part 'mandate.g.dart';

@freezed
class Mandate with _$Mandate {
  const factory Mandate({
    required String id,
    required String title,
    String? description,
    @JsonKey(name: 'holder_name') String? holderName,
    required String level, // federal, estadual, municipal
    required String status, // active, completed, cancelled
    @JsonKey(name: 'start_date') DateTime? startDate,
    @JsonKey(name: 'end_date') DateTime? endDate,
  }) = _Mandate;
  factory Mandate.fromJson(Map<String, dynamic> json) =>
      _$MandateFromJson(json);
}
