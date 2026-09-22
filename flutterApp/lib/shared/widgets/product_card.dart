import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../models/product.dart';
import '../providers.dart';
import '../../features/wishlist/providers/wishlist_provider.dart';

class AppProductCard extends ConsumerWidget {
  const AppProductCard({super.key, required this.product});
  final Product product;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProvider).items[product.id]?.quantity ?? 0;
    final favorite = ref.watch(wishlistProvider).contains(product.id);
    final money = NumberFormat.simpleCurrency(name: 'ILS');
    return SizedBox(
      width: 190,
      height: 328,
      child: Card(
        elevation: 2,
        shadowColor: const Color(0x22071d3a),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/products/${product.id}'),
          child: Padding(
            padding: const EdgeInsets.all(9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 148,
                  width: double.infinity,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: product.image.isEmpty
                              ? ColoredBox(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.surfaceContainerHighest,
                                  child: Icon(
                                    Icons.shopping_bag_outlined,
                                    size: 54,
                                  ),
                                )
                              : ClipRRect(
                                  borderRadius: BorderRadius.circular(15),
                                  child: CachedNetworkImage(
                                    width: double.infinity,
                                    height: double.infinity,
                                    imageUrl: product.image,
                                    fit: BoxFit.cover,
                                    placeholder: (_, _) => ColoredBox(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.surfaceContainerHighest,
                                    ),
                                    errorWidget: (_, _, _) => ColoredBox(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.surfaceContainerHighest,
                                      child: Icon(
                                        Icons.image_not_supported_outlined,
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                        if (product.discounted)
                          Positioned(
                            top: 6,
                            left: 6,
                            child: Chip(
                              label: Text(
                                context.locale.languageCode == 'ar'
                                    ? 'عرض'
                                    : 'DEAL',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                ),
                              ),
                              backgroundColor: Color(0xffe10613),
                              side: BorderSide.none,
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                        Positioned(
                          top: 6,
                          right: 6,
                          child: IconButton.filledTonal(
                            tooltip: favorite
                                ? (context.locale.languageCode == 'ar'
                                      ? 'إزالة من المفضلة'
                                      : 'Remove from favorites')
                                : (context.locale.languageCode == 'ar'
                                      ? 'إضافة إلى المفضلة'
                                      : 'Add to favorites'),
                            onPressed: () => ref
                                .read(wishlistProvider.notifier)
                                .toggle(product.id),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white.withValues(
                                alpha: .92,
                              ),
                              foregroundColor: const Color(0xff52675b),
                              minimumSize: const Size(34, 34),
                              padding: EdgeInsets.zero,
                            ),
                            icon: Icon(
                              favorite ? Icons.favorite : Icons.favorite_border,
                              size: 18,
                              color: favorite ? Colors.red : null,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      product.category,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 6),
                const Spacer(),
                if (product.discounted)
                  Text(
                    money.format(product.price),
                    style: const TextStyle(
                      decoration: TextDecoration.lineThrough,
                      color: Colors.grey,
                      fontSize: 12,
                    ),
                  ),
                const Divider(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        money.format(product.finalPrice),
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          letterSpacing: -.2,
                        ),
                      ),
                    ),
                    if (qty == 0)
                      IconButton.filled(
                        tooltip: context.locale.languageCode == 'ar'
                            ? 'أضف إلى السلة'
                            : 'Add to cart',
                        onPressed: () =>
                            ref.read(cartProvider.notifier).add(product),
                        style: IconButton.styleFrom(
                          minimumSize: const Size(40, 40),
                          backgroundColor: const Color(0xff16803c),
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(
                          Icons.add_shopping_cart_rounded,
                          size: 19,
                        ),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          color: Theme.of(
                            context,
                          ).colorScheme.secondaryContainer,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _quantityButton(
                              icon: Icons.remove,
                              label: context.locale.languageCode == 'ar'
                                  ? 'تقليل الكمية'
                                  : 'Decrease quantity',
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .decrement(product.id),
                            ),
                            ConstrainedBox(
                              constraints: const BoxConstraints(minWidth: 20),
                              child: Text(
                                '$qty',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                            ),
                            _quantityButton(
                              icon: Icons.add,
                              label: context.locale.languageCode == 'ar'
                                  ? 'زيادة الكمية'
                                  : 'Increase quantity',
                              onPressed: () =>
                                  ref.read(cartProvider.notifier).add(product),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _quantityButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) => Semantics(
    button: true,
    label: label,
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onPressed,
      child: SizedBox(
        width: 30,
        height: 36,
        child: Icon(icon, size: 17, color: const Color(0xff16803c)),
      ),
    ),
  );
}
