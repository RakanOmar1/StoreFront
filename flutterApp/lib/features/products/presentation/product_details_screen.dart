import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/providers.dart';
import '../../../shared/widgets/product_card.dart';
import '../../wishlist/providers/wishlist_provider.dart';

class ProductDetailsScreen extends ConsumerStatefulWidget {
  const ProductDetailsScreen({super.key, required this.id});
  final int id;
  @override
  ConsumerState<ProductDetailsScreen> createState() => _DetailsState();
}

class _DetailsState extends ConsumerState<ProductDetailsScreen> {
  int quantity = 1;
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(productProvider(widget.id));
    return Scaffold(
      appBar: AppBar(),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                context.locale.languageCode == 'ar'
                    ? 'تعذر تحميل المنتج'
                    : 'Could not load product',
              ),
              TextButton(
                onPressed: () => ref.invalidate(productProvider(widget.id)),
                child: Text('retry'.tr()),
              ),
            ],
          ),
        ),
        data: (product) {
          final wished = ref.watch(wishlistProvider).contains(product.id);
          final money = NumberFormat.simpleCurrency(name: 'ILS');
          final images = {
            product.image,
            ...product.images,
          }.where((x) => x.isNotEmpty).toList();
          return Stack(
            children: [
              CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: CarouselSlider(
                      items: (images.isEmpty ? [''] : images)
                          .map(
                            (url) => Container(
                              color: Theme.of(
                                context,
                              ).colorScheme.surfaceContainerHighest,
                              child: url.isEmpty
                                  ? const Center(
                                      child: Icon(
                                        Icons.image_outlined,
                                        size: 90,
                                      ),
                                    )
                                  : CachedNetworkImage(
                                      imageUrl: url,
                                      fit: BoxFit.contain,
                                      errorWidget: (_, _, _) => const Icon(
                                        Icons.broken_image_outlined,
                                      ),
                                    ),
                            ),
                          )
                          .toList(),
                      options: CarouselOptions(
                        height: 330,
                        viewportFraction: 1,
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 130),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        Text(
                          product.category,
                          style: const TextStyle(
                            color: AppColors.green,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Text(
                              money.format(product.finalPrice),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            if (product.discounted) ...[
                              const SizedBox(width: 10),
                              Text(
                                money.format(product.price),
                                style: const TextStyle(
                                  color: Colors.grey,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Icon(Icons.check_circle, color: AppColors.green),
                            SizedBox(width: 7),
                            Text(
                              context.locale.languageCode == 'ar'
                                  ? 'متوفر'
                                  : 'In stock',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text(
                          context.locale.languageCode == 'ar'
                              ? 'الوصف'
                              : 'Description',
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          product.description.isEmpty
                              ? (context.locale.languageCode == 'ar'
                                    ? 'منتج عالي الجودة مختار من سفن ستارز مول.'
                                    : 'Quality product selected by 7 Stars Mall.')
                              : product.description,
                          style: const TextStyle(height: 1.6),
                        ),
                        const SizedBox(height: 28),
                        Text(
                          context.locale.languageCode == 'ar'
                              ? 'منتجات مشابهة'
                              : 'Similar products',
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 328,
                          child: Consumer(
                            builder: (context, ref, child) {
                              final all = ref.watch(productsProvider);
                              return all.when(
                                loading: () => const Center(
                                  child: CircularProgressIndicator(),
                                ),
                                error: (_, _) => const SizedBox.shrink(),
                                data: (items) => ListView(
                                  scrollDirection: Axis.horizontal,
                                  children: items
                                      .where(
                                        (x) =>
                                            x.id != product.id &&
                                            x.category == product.category,
                                      )
                                      .take(8)
                                      .map((x) => AppProductCard(product: x))
                                      .toList(),
                                ),
                              );
                            },
                          ),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: SafeArea(
                  top: false,
                  child: Container(
                    color: Theme.of(context).colorScheme.surface,
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      children: [
                        IconButton(
                          tooltip: wished
                              ? (context.locale.languageCode == 'ar'
                                    ? 'إزالة من المفضلة'
                                    : 'Remove from favorites')
                              : (context.locale.languageCode == 'ar'
                                    ? 'إضافة إلى المفضلة'
                                    : 'Add to favorites'),
                          onPressed: () => ref
                              .read(wishlistProvider.notifier)
                              .toggle(product.id),
                          icon: Icon(
                            wished ? Icons.favorite : Icons.favorite_border,
                            color: wished ? AppColors.red : null,
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: Theme.of(
                              context,
                            ).colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                onPressed: quantity > 1
                                    ? () => setState(() => quantity--)
                                    : null,
                                icon: const Icon(Icons.remove),
                              ),
                              Text(
                                '$quantity',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              IconButton(
                                onPressed: () => setState(() => quantity++),
                                icon: const Icon(Icons.add),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FilledButton(
                            onPressed: () {
                              ref
                                  .read(cartProvider.notifier)
                                  .add(product, quantity: quantity);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    context.locale.languageCode == 'ar'
                                        ? 'تمت الإضافة إلى السلة'
                                        : 'Added to cart',
                                  ),
                                ),
                              );
                            },
                            style: FilledButton.styleFrom(
                              minimumSize: const Size(0, 54),
                            ),
                            child: Text(
                              context.locale.languageCode == 'ar'
                                  ? 'أضف إلى السلة'
                                  : 'Add to cart',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
