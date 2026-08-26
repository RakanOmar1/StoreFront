import '../../../core/api/api_client.dart';
import '../../../shared/models/product.dart';

class ProductRepository {
  ProductRepository(this.api);
  final ApiClient api;
  Future<List<Product>> products({
    String? search,
    String? category,
    int limit = 30,
    int offset = 0,
  }) async {
    final r = await api.dio.get(
      '/products',
      queryParameters: {
        'search': ?search,
        'category': ?category,
        'limit': limit,
        'offset': offset,
      },
    );
    final raw = r.data is List
        ? r.data
        : (r.data is Map ? r.data['value'] : null);
    return (raw as List? ?? const [])
        .whereType<Map>()
        .map((e) => Product.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<Product> product(int id) async {
    final response = await api.dio.get('/products/$id');
    return Product.fromJson(Map<String, dynamic>.from(response.data as Map));
  }
}
