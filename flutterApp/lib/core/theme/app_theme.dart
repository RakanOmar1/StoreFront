import 'package:flutter/material.dart';

abstract final class AppColors {
  static const green = Color(0xff16803c),
      darkGreen = Color(0xff07542b),
      red = Color(0xffe10613);
  static const orange = Color(0xffd98435),
      navy = Color(0xff071d3a),
      background = Color(0xfff5f7f6);
}

ThemeData buildTheme({bool arabic = false}) => ThemeData(
  useMaterial3: true,
  fontFamily: arabic ? 'Cairo' : null,
  scaffoldBackgroundColor: AppColors.background,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.green,
    primary: AppColors.green,
    secondary: AppColors.red,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.white,
    foregroundColor: AppColors.navy,
    surfaceTintColor: Colors.transparent,
  ),
  cardTheme: const CardThemeData(
    color: Colors.white,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(18)),
    ),
  ),
  inputDecorationTheme: const InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide.none,
    ),
  ),
  navigationBarTheme: const NavigationBarThemeData(
    backgroundColor: Colors.white,
    indicatorColor: Color(0xffe2f3e7),
  ),
  dividerColor: const Color(0xffe2e8e4),
);

ThemeData buildDarkTheme({bool arabic = false}) => ThemeData(
  useMaterial3: true,
  fontFamily: arabic ? 'Cairo' : null,
  brightness: Brightness.dark,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.green,
    brightness: Brightness.dark,
    primary: const Color(0xff55c878),
  ),
  scaffoldBackgroundColor: const Color(0xff101512),
  cardTheme: const CardThemeData(
    color: Color(0xff19211c),
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(18)),
    ),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xff101512),
    surfaceTintColor: Colors.transparent,
  ),
  inputDecorationTheme: const InputDecorationTheme(
    filled: true,
    fillColor: Color(0xff202a23),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide.none,
    ),
  ),
  navigationBarTheme: const NavigationBarThemeData(
    backgroundColor: Color(0xff151d18),
    indicatorColor: Color(0xff294c35),
  ),
  dividerColor: const Color(0xff334039),
  dialogTheme: const DialogThemeData(backgroundColor: Color(0xff19211c)),
);
