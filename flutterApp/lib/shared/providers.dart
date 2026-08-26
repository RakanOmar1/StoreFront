import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/api/api_client.dart';
import '../features/products/data/product_repository.dart';
import '../features/categories/data/category_repository.dart';
import 'models/category.dart';
import 'models/product.dart';
export '../features/cart/providers/cart_provider.dart';

final secureStorageProvider = Provider((_) => const FlutterSecureStorage());
final animationsEnabledProvider = Provider((_) => true);
final apiClientProvider = Provider(
  (r) => ApiClient(r.watch(secureStorageProvider)),
);
final productRepositoryProvider = Provider(
  (r) => ProductRepository(r.watch(apiClientProvider)),
);
final categoryRepositoryProvider = Provider(
  (r) => CategoryRepository(r.watch(apiClientProvider)),
);
final productsProvider = FutureProvider<List<Product>>(
  (r) => r.watch(productRepositoryProvider).products(),
);
final categoriesProvider = FutureProvider<List<Category>>(
  (r) => r.watch(categoryRepositoryProvider).categories(),
);
final categoryProvider = FutureProvider.family<Category, int>(
  (r, id) => r.watch(categoryRepositoryProvider).category(id),
);
final productProvider = FutureProvider.family<Product, int>(
  (r, id) => r.watch(productRepositoryProvider).product(id),
);
