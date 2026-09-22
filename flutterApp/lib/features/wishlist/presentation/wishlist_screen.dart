import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/providers.dart';
import '../../../shared/widgets/product_card.dart';
import '../providers/wishlist_provider.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ids = ref.watch(wishlistProvider);
    return Scaffold(
      appBar: AppBar(title: Text('wishlist'.tr())),
      body: ref
          .watch(productsProvider)
          .when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, _) => Center(
              child: FilledButton.icon(
                onPressed: () => ref.invalidate(productsProvider),
                icon: const Icon(Icons.refresh),
                label: Text('retry'.tr()),
              ),
            ),
            data: (products) {
              final favorites = products
                  .where((item) => ids.contains(item.id))
                  .toList();
              if (favorites.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.favorite_border,
                          size: 68,
                          color: Color(0xff16803c),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _label(
                            context,
                            'لا توجد منتجات مفضلة بعد',
                            'No favorites yet',
                          ),
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _label(
                            context,
                            'اضغط على القلب في أي منتج لحفظه هنا.',
                            'Tap the heart on any product to save it here.',
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              }
              return LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 900
                      ? 4
                      : constraints.maxWidth >= 560
                      ? 3
                      : 2;
                  return GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      mainAxisExtent: 328,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: favorites.length,
                    itemBuilder: (_, index) =>
                        AppProductCard(product: favorites[index]),
                  );
                },
              );
            },
          ),
    );
  }

  String _label(BuildContext context, String ar, String en) =>
      context.locale.languageCode == 'ar' ? ar : en;
}
