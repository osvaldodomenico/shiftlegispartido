import 'package:freezed_annotation/freezed_annotation.dart';
part 'task.freezed.dart';
part 'task.g.dart';

@freezed
class Task with _$Task {
  const factory Task({
    required String id,
    required String title,
    String? description,
    required String status, // pending, in_progress, done, cancelled
    required String priority, // low, medium, high, urgent
    @JsonKey(name: 'due_date') DateTime? dueDate,
    @JsonKey(name: 'person_id') String? personId,
    @JsonKey(name: 'person_name') String? personName,
    @JsonKey(name: 'assigned_to_name') String? assignedToName,
    @JsonKey(name: 'completed_at') DateTime? completedAt,
  }) = _Task;
  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}
