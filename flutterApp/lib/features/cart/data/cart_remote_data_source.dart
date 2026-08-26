import '../../../core/api/api_client.dart';
import '../models/cart_state.dart';

class CartRemoteDataSource {
  CartRemoteDataSource(this.api);
  final ApiClient api;

  Future<Map<int, CartLine>> fetch() async {
    final response = await api.dio.get('/cart');
    final data = Map<String, dynamic>.from(response.data as Map);
    final rawItems = data['items'] as List? ?? const [];
    return {
      for (final raw in rawItems)
        if (raw is Map && raw['product'] is Map)
          int.parse('${raw['product_id']}'): CartLine.fromJson({
            'product': raw['product'],
            'quantity': raw['quantity'],
          }),
    };
  }

  Future<void> add(int productId, int quantity) async {
    await api.dio.post(
      '/cart/add',
      data: {'productId': productId, 'quantity': quantity},
    );
  }

  Future<void> update(int productId, int quantity) async {
    await api.dio.patch(
      '/cart/update',
      data: {'productId': productId, 'quantity': quantity},
    );
  }

  Future<void> remove(int productId) async {
    await api.dio.delete('/cart/remove/$productId');
  }
}
