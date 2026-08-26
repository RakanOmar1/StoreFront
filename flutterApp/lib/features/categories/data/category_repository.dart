import '../../../core/api/api_client.dart';
import '../../../shared/models/category.dart';

class CategoryRepository {
  CategoryRepository(this.api);
  final ApiClient api;
  Future<List<Category>> categories() async {
    final response = await api.dio.get('/categories');
    return (response.data as List? ?? const [])
        .whereType<Map>()
        .map((item) => Category.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<Category> category(int id) async => Category.fromJson(
    Map<String, dynamic>.from(
      (await api.dio.get('/categories/$id')).data as Map,
    ),
  );
}
