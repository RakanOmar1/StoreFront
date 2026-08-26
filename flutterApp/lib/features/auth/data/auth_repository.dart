import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_client.dart';
import '../models/app_user.dart';

class AuthRepository {
  AuthRepository(this.api, this.storage);
  final ApiClient api;
  final FlutterSecureStorage storage;
  static const tokenKey = 'auth_token', userKey = 'auth_user';
  Future<AppUser?> restore() async {
    final token = await storage.read(key: tokenKey);
    final raw = await storage.read(key: userKey);
    if (token == null || raw == null || _expired(token)) {
      await clear();
      return null;
    }
    try {
      return AppUser.fromJson(
        Map<String, dynamic>.from(jsonDecode(raw) as Map),
      );
    } catch (_) {
      await clear();
      return null;
    }
  }

  Future<AppUser> login(String identifier, String password) async {
    final r = await api.dio.post(
      '/auth/login',
      data: {'identifier': identifier.trim(), 'password': password},
    );
    return _save(Map<String, dynamic>.from(r.data as Map));
  }

  Future<AppUser> register({
    required String firstname,
    required String lastname,
    required String email,
    required String phone,
    required String password,
  }) async {
    final r = await api.dio.post(
      '/auth/register',
      data: {
        'firstname': firstname.trim(),
        'lastname': lastname.trim(),
        'email': email.trim().isEmpty ? null : email.trim(),
        'phone': phone.trim().isEmpty ? null : phone.trim(),
        'password': password,
      },
    );
    return _save(Map<String, dynamic>.from(r.data as Map));
  }

  Future<void> logout() async {
    try {
      await api.dio.post('/auth/logout');
    } catch (_) {}
    await clear();
  }

  Future<AppUser> profile() async => _storeUser(
    Map<String, dynamic>.from((await api.dio.get('/profile')).data as Map),
  );
  Future<AppUser> updateProfile({
    required String name,
    required String phone,
    required String address,
    required String city,
  }) async => _storeUser(
    Map<String, dynamic>.from(
      (await api.dio.patch(
            '/profile',
            data: {
              'name': name,
              'phone': phone,
              'address': address,
              'city': city,
            },
          )).data
          as Map,
    ),
  );
  Future<AppUser> uploadAvatar(XFile file) async {
    final form = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(file.path, filename: file.name),
    });
    return _storeUser(
      Map<String, dynamic>.from(
        (await api.dio.post('/profile/avatar', data: form)).data as Map,
      ),
    );
  }

  Future<AppUser> removeAvatar() async => _storeUser(
    Map<String, dynamic>.from(
      (await api.dio.delete('/profile/avatar')).data as Map,
    ),
  );
  Future<void> changePassword(String current, String next) async {
    await api.dio.patch(
      '/profile/password',
      data: {'currentPassword': current, 'newPassword': next},
    );
  }

  Future<AppUser> _storeUser(Map<String, dynamic> json) async {
    final user = AppUser.fromJson(json);
    await storage.write(key: userKey, value: jsonEncode(user.toJson()));
    return user;
  }

  Future<AppUser> _save(Map<String, dynamic> data) async {
    final token = data['token']?.toString();
    final user = AppUser.fromJson(
      Map<String, dynamic>.from(data['user'] as Map),
    );
    if (token == null || token.isEmpty || user.id == 0) {
      throw const FormatException('Invalid authentication response');
    }
    await storage.write(key: tokenKey, value: token);
    await storage.write(key: userKey, value: jsonEncode(user.toJson()));
    return user;
  }

  Future<void> clear() async {
    await storage.delete(key: tokenKey);
    await storage.delete(key: userKey);
  }

  bool _expired(String token) {
    try {
      final part = token.split('.')[1];
      final normalized = base64Url.normalize(part);
      final payload = Map<String, dynamic>.from(
        jsonDecode(utf8.decode(base64Url.decode(normalized))) as Map,
      );
      final exp = int.tryParse('${payload['exp']}') ?? 0;
      return DateTime.now().millisecondsSinceEpoch >= exp * 1000;
    } catch (_) {
      return true;
    }
  }
}
