import 'package:flutter/material.dart';

class AppTheme {
  static const _seedColor = Color(0xFF1565C0); // azul institucional

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorSchemeSeed: _seedColor,
      brightness: Brightness.light,
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      colorSchemeSeed: _seedColor,
      brightness: Brightness.dark,
    );
  }
}
