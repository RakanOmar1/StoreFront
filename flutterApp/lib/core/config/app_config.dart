import 'package:flutter/foundation.dart';

abstract final class AppConfig {
  static const productionApiBaseUrl =
      'https://mall7stars-d3c123d08509.herokuapp.com';

  static String get apiBaseUrl {
    const configured = String.fromEnvironment('API_BASE_URL');
    if (configured.isNotEmpty) return configured;
    if (kReleaseMode) return productionApiBaseUrl;
    if (kIsWeb) return 'http://localhost:3000';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000';
  }
}
