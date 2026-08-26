import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppThemePreference { system, light, dark }

final themeProvider = NotifierProvider<ThemeNotifier, AppThemePreference>(
  ThemeNotifier.new,
);

class ThemeNotifier extends Notifier<AppThemePreference> {
  @override
  AppThemePreference build() {
    Future.microtask(_load);
    return AppThemePreference.system;
  }

  Future<void> _load() async {
    final p = await SharedPreferences.getInstance();
    state = AppThemePreference.values.firstWhere(
      (e) => e.name == p.getString('theme_preference'),
      orElse: () => AppThemePreference.system,
    );
  }

  Future<void> set(AppThemePreference value) async {
    state = value;
    final p = await SharedPreferences.getInstance();
    await p.setString('theme_preference', value.name);
  }

  ThemeMode get mode => switch (state) {
    AppThemePreference.light => ThemeMode.light,
    AppThemePreference.dark => ThemeMode.dark,
    _ => ThemeMode.system,
  };
}
