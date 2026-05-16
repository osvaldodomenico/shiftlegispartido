class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final String? code;

  const ApiException({
    this.statusCode,
    required this.message,
    this.code,
  });

  factory ApiException.fromDioError(dynamic error) {
    if (error?.response != null) {
      final data = error.response.data;
      final message =
          data is Map ? (data['message'] ?? 'Erro desconhecido') : 'Erro desconhecido';
      final code = data is Map ? data['error']?['code'] : null;
      return ApiException(
        statusCode: error.response.statusCode,
        message: message.toString(),
        code: code?.toString(),
      );
    }
    return const ApiException(message: 'Sem conexão com o servidor');
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}
