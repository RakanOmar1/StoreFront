import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/product.dart';
import '../data/cart_repository.dart';
import '../models/cart_state.dart';

final cartRepositoryProvider = Provider((_) => CartRepository());
final cartProvider = NotifierProvider<CartNotifier, CartState>(
  CartNotifier.new,
);

class CartNotifier extends Notifier<CartState> {
  late CartRepository repository;
  @override
  CartState build() {
    repository = ref.watch(cartRepositoryProvider);
    Future.microtask(refresh);
    return const CartState(loading: true);
  }

  Future<void> refresh() async {
    try {
      final items = await repository.load();
      state = CartState(items: items);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'cartLoadError');
    }
  }

  Future<void> add(Product product, {int quantity = 1}) async {
    final old = state;
    final current = state.items[product.id];
    final items = {
      ...state.items,
      product.id: CartLine(
        product: product,
        quantity: (current?.quantity ?? 0) + quantity,
      ),
    };
    state = state.copyWith(items: items, mutating: true, clearError: true);
    await _persist(old);
  }

  Future<void> setQuantity(Product product, int quantity) async {
    if (quantity <= 0) return remove(product.id);
    final old = state;
    state = state.copyWith(
      items: {
        ...state.items,
        product.id: CartLine(product: product, quantity: quantity),
      },
      mutating: true,
      clearError: true,
    );
    await _persist(old);
  }

  Future<void> decrement(int id) async {
    final line = state.items[id];
    if (line == null) return;
    if (line.quantity <= 1) {
      await remove(id);
    } else {
      await setQuantity(line.product, line.quantity - 1);
    }
  }

  Future<void> remove(int id) async {
    final old = state;
    final items = {...state.items}..remove(id);
    state = state.copyWith(items: items, mutating: true, clearError: true);
    await _persist(old);
  }

  Future<void> clear() async {
    final old = state;
    state = state.copyWith(items: {}, mutating: true, clearError: true);
    await _persist(old);
  }

  Future<void> restoreLine(CartLine line) async {
    await setQuantity(line.product, line.quantity);
  }

  Future<void> _persist(CartState rollback) async {
    try {
      await repository.save(state.items);
      state = state.copyWith(mutating: false);
    } catch (_) {
      state = rollback.copyWith(mutating: false, error: 'cartUpdateError');
    }
  }
}
