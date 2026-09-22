import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final wishlistProvider = NotifierProvider<WishlistNotifier, Set<int>>(
  WishlistNotifier.new,
);

class WishlistNotifier extends Notifier<Set<int>> {
  static const _key = 'wishlist_product_ids';

  @override
  Set<int> build() {
    Future.microtask(_load);
    return <int>{};
  }

  Future<void> _load() async {
    final preferences = await SharedPreferences.getInstance();
    state =
        preferences
            .getStringList(_key)
            ?.map(int.tryParse)
            .whereType<int>()
            .toSet() ??
        <int>{};
  }

  Future<void> toggle(int productId) async {
    final next = {...state};
    next.contains(productId) ? next.remove(productId) : next.add(productId);
    state = next;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setStringList(
      _key,
      next.map((id) => '$id').toList(growable: false),
    );
  }
}
