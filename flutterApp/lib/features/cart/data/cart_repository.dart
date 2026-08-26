import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_state.dart';

class CartRepository {
  static const key = 'guest_cart_v1';
  Future<Map<int, CartLine>> load() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(key);
    if (raw == null) return {};
    try {
      final list = jsonDecode(raw) as List;
      return {
        for (final e in list)
          CartLine.fromJson(Map<String, dynamic>.from(e as Map)).product.id:
              CartLine.fromJson(Map<String, dynamic>.from(e)),
      };
    } catch (_) {
      await p.remove(key);
      return {};
    }
  }

  Future<void> save(Map<int, CartLine> items) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(
      key,
      jsonEncode(items.values.map((e) => e.toJson()).toList()),
    );
  }
}
