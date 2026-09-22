import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  ApiClient(this.storage)
    : dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 15),
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (o, h) async {
          final token = await storage.read(key: 'auth_token');
          if (token != null) o.headers['Authorization'] = 'Bearer $token';
          h.next(o);
        },
        onError: (error, handler) async {
          final authenticatedRequest =
              error.requestOptions.headers['Authorization'] != null;
          if (error.response?.statusCode == 401 && authenticatedRequest) {
            await storage.delete(key: 'auth_token');
            await storage.delete(key: 'auth_user');
            _unauthorized.add(null);
          }
          handler.next(error);
        },
      ),
    );
  }
  final FlutterSecureStorage storage;
  final Dio dio;
  final StreamController<void> _unauthorized = StreamController.broadcast();

  Stream<void> get unauthorized => _unauthorized.stream;

  void dispose() => _unauthorized.close();
}
