import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/providers.dart';
import '../data/auth_repository.dart';
import '../models/app_user.dart';
import 'package:image_picker/image_picker.dart';

final authRepositoryProvider = Provider(
  (r) => AuthRepository(
    r.watch(apiClientProvider),
    r.watch(secureStorageProvider),
  ),
);
final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends Notifier<AuthState> {
  late AuthRepository repo;
  @override
  AuthState build() {
    repo = ref.watch(authRepositoryProvider);
    Future.microtask(restore);
    return const AuthState(loading: true);
  }

  Future<void> restore() async {
    final cached = await repo.restore();
    if (cached == null) {
      state = const AuthState();
      return;
    }
    try {
      state = AuthState(user: await repo.profile());
    } catch (_) {
      state = AuthState(user: cached, error: 'profileLoadError');
    }
  }

  Future<bool> login(String id, String password) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      state = AuthState(user: await repo.login(id, password));
      return true;
    } catch (_) {
      state = const AuthState(error: 'invalidCredentials');
      return false;
    }
  }

  Future<bool> register({
    required String firstname,
    required String lastname,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      state = AuthState(
        user: await repo.register(
          firstname: firstname,
          lastname: lastname,
          email: email,
          phone: phone,
          password: password,
        ),
      );
      return true;
    } catch (_) {
      state = const AuthState(error: 'registrationFailed');
      return false;
    }
  }

  Future<void> logout() async {
    await repo.logout();
    state = const AuthState();
  }

  Future<bool> refreshProfile() async {
    try {
      state = AuthState(user: await repo.profile());
      return true;
    } catch (_) {
      state = state.copyWith(error: 'profileLoadError');
      return false;
    }
  }

  Future<bool> updateProfile({
    required String name,
    required String phone,
    required String address,
    required String city,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      state = AuthState(
        user: await repo.updateProfile(
          name: name,
          phone: phone,
          address: address,
          city: city,
        ),
      );
      return true;
    } catch (_) {
      state = state.copyWith(loading: false, error: 'profileUpdateError');
      return false;
    }
  }

  Future<bool> uploadAvatar(XFile file) async {
    try {
      state = AuthState(user: await repo.uploadAvatar(file));
      return true;
    } catch (_) {
      state = state.copyWith(error: 'avatarUploadError');
      return false;
    }
  }

  Future<bool> removeAvatar() async {
    try {
      state = AuthState(user: await repo.removeAvatar());
      return true;
    } catch (_) {
      state = state.copyWith(error: 'avatarUploadError');
      return false;
    }
  }

  Future<bool> changePassword(String current, String next) async {
    try {
      await repo.changePassword(current, next);
      return true;
    } catch (_) {
      state = state.copyWith(error: 'passwordChangeError');
      return false;
    }
  }
}
