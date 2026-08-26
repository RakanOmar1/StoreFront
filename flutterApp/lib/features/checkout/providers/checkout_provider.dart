import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../shared/providers.dart';
import '../../cart/data/cart_remote_data_source.dart';
import '../../cart/models/cart_state.dart';
import '../data/checkout_repository.dart';
import '../models/checkout_models.dart';
import '../../auth/providers/auth_provider.dart';

enum CheckoutStatus {
  initial,
  synchronizing,
  synchronizationFailed,
  ready,
  submitting,
  success,
  failure,
}

class CheckoutState {
  const CheckoutState({
    this.status = CheckoutStatus.initial,
    this.backendItems = const {},
    this.error,
    this.result,
  });
  final CheckoutStatus status;
  final Map<int, CartLine> backendItems;
  final String? error;
  final CheckoutResponse? result;
  bool get busy =>
      status == CheckoutStatus.synchronizing ||
      status == CheckoutStatus.submitting;
  double get total => backendItems.values.fold(
    0,
    (s, e) => s + e.product.finalPrice * e.quantity,
  );
}

final checkoutRepositoryProvider = Provider(
  (r) => CheckoutRepository(r.watch(apiClientProvider)),
);
final cartRemoteProvider = Provider(
  (r) => CartRemoteDataSource(r.watch(apiClientProvider)),
);
final checkoutProvider = NotifierProvider<CheckoutNotifier, CheckoutState>(
  CheckoutNotifier.new,
);

class CheckoutNotifier extends Notifier<CheckoutState> {
  static const ledgerKey = 'cart_sync_targets_v1';
  late CartRemoteDataSource remote;
  late CheckoutRepository checkout;
  @override
  CheckoutState build() {
    remote = ref.watch(cartRemoteProvider);
    checkout = ref.watch(checkoutRepositoryProvider);
    return const CheckoutState();
  }

  Future<bool> synchronize() async {
    if (state.status == CheckoutStatus.synchronizing) return false;
    state = const CheckoutState(status: CheckoutStatus.synchronizing);
    try {
      final guest = ref.read(cartProvider).items;
      final before = await remote.fetch();
      final prefs = await SharedPreferences.getInstance();
      Map<int, int> targets = {};
      final saved = prefs.getString(ledgerKey);
      if (saved != null) {
        final decoded = Map<String, dynamic>.from(jsonDecode(saved) as Map);
        targets = decoded.map(
          (k, v) => MapEntry(int.parse(k), int.parse('$v')),
        );
      } else {
        for (final line in guest.values) {
          targets[line.product.id] =
              (before[line.product.id]?.quantity ?? 0) + line.quantity;
        }
        await prefs.setString(
          ledgerKey,
          jsonEncode(targets.map((k, v) => MapEntry('$k', v))),
        );
      }
      for (final e in targets.entries) {
        if (before[e.key] == null) {
          await remote.add(e.key, e.value);
        } else if (before[e.key]!.quantity != e.value) {
          await remote.update(e.key, e.value);
        }
      }
      final verified = await remote.fetch();
      final valid = targets.entries.every(
        (e) => verified[e.key]?.quantity == e.value,
      );
      if (!valid) throw StateError('Cart verification failed');
      state = CheckoutState(
        status: CheckoutStatus.ready,
        backendItems: verified,
      );
      return true;
    } catch (error) {
      if (error is DioException && error.response?.statusCode == 401) {
        await ref.read(authProvider.notifier).logout();
        state = const CheckoutState(
          status: CheckoutStatus.synchronizationFailed,
          error: 'authExpired',
        );
        return false;
      }
      state = const CheckoutState(
        status: CheckoutStatus.synchronizationFailed,
        error: 'cartSyncFailed',
      );
      return false;
    }
  }

  Future<CheckoutResponse?> submit(CheckoutRequest request) async {
    if (state.status != CheckoutStatus.ready) return null;
    final review = await remote.fetch();
    if (review.isEmpty) {
      state = CheckoutState(
        status: CheckoutStatus.failure,
        backendItems: state.backendItems,
        error: 'backendCartEmpty',
      );
      return null;
    }
    state = CheckoutState(
      status: CheckoutStatus.submitting,
      backendItems: review,
    );
    try {
      final result = await checkout.place(request);
      await ref.read(cartProvider.notifier).clear();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(ledgerKey);
      try {
        await remote.fetch();
      } catch (_) {}
      state = CheckoutState(status: CheckoutStatus.success, result: result);
      return result;
    } catch (error) {
      if (error is DioException && error.response?.statusCode == 401) {
        await ref.read(authProvider.notifier).logout();
        state = CheckoutState(
          status: CheckoutStatus.failure,
          backendItems: review,
          error: 'authExpired',
        );
        return null;
      }
      state = CheckoutState(
        status: CheckoutStatus.failure,
        backendItems: review,
        error: 'checkoutUncertain',
      );
      return null;
    }
  }
}
