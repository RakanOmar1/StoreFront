import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/providers.dart';
import '../../../shared/models/category.dart';
import '../../products/presentation/product_listing_screen.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Categories')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Could not load categories'),
              TextButton(
                onPressed: () => ref.invalidate(categoriesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (items) => items.isEmpty
            ? const Center(child: Text('No categories available'))
            : RefreshIndicator(
                onRefresh: () => ref.refresh(categoriesProvider.future),
                child: GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                  itemCount: items.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisExtent: 145,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemBuilder: (_, i) {
                    final category = items[i];
                    return Card(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap: () => context.push(
                          '/categories/${category.id}',
                          extra: category,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const CircleAvatar(
                                backgroundColor: Color(0xffeaf6ee),
                                child: Icon(
                                  Icons.shopping_basket_outlined,
                                  color: AppColors.green,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                category.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                              if (category.description?.isNotEmpty ?? false)
                                Text(
                                  category.description!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}

class CategoryProductRoute extends ConsumerWidget {
  const CategoryProductRoute({super.key, required this.id, this.initial});
  final int id;
  final Category? initial;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (initial != null) {
      return ProductListingScreen(
        title: initial!.name,
        category: initial!.name,
      );
    }
    return ref
        .watch(categoryProvider(id))
        .when(
          loading: () =>
              const Scaffold(body: Center(child: CircularProgressIndicator())),
          error: (_, _) => Scaffold(
            body: Center(
              child: TextButton(
                onPressed: () => ref.invalidate(categoryProvider(id)),
                child: const Text('Retry'),
              ),
            ),
          ),
          data: (category) => ProductListingScreen(
            title: category.name,
            category: category.name,
          ),
        );
  }
}
