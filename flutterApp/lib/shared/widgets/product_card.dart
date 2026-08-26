import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/product.dart';
import '../providers.dart';

class AppProductCard extends ConsumerWidget {
  const AppProductCard({super.key, required this.product});
  final Product product;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProvider).items[product.id]?.quantity ?? 0;
    final money = NumberFormat.simpleCurrency(name: 'ILS');
    return SizedBox(
      width: 190,
      height: 272,
      child: Card(
        elevation: 1.5,
        shadowColor: const Color(0x16071d3a),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xffe7ece9)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/products/${product.id}'),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 118,
                  width: double.infinity,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: const Color(0xfff1f5f2),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: product.image.isEmpty
                              ? const ColoredBox(
                                  color: Color(0xffeef3ef),
                                  child: Icon(
                                    Icons.shopping_bag_outlined,
                                    size: 54,
                                  ),
                                )
                              : Padding(
                                  padding: const EdgeInsets.all(8),
                                  child: CachedNetworkImage(
                                    imageUrl: product.image,
                                    fit: BoxFit.contain,
                                    placeholder: (_, _) => const ColoredBox(
                                      color: Color(0xffeef3ef),
                                    ),
                                    errorWidget: (_, _, _) => const Icon(
                                      Icons.image_not_supported_outlined,
                                    ),
                                  ),
                                ),
                        ),
                        if (product.discounted)
                          const Positioned(
                            top: 6,
                            left: 6,
                            child: Chip(
                              label: Text(
                                'DEAL',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                ),
                              ),
                              backgroundColor: Color(0xffe10613),
                              side: BorderSide.none,
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 11),
                Text(
                  product.category,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: .35,
                  ),
                ),
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14.5,
                    height: 1.18,
                  ),
                ),
                const SizedBox(height: 8),
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
                Container(
                  height: 1,
                  margin: const EdgeInsets.only(bottom: 7),
                  color: const Color(0xffedf1ef),
                ),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        money.format(product.finalPrice),
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 17,
                          letterSpacing: -.2,
                        ),
                      ),
                    ),
                    if (qty == 0)
                      IconButton.filled(
                        tooltip: 'View product',
                        onPressed: () =>
                            context.push('/products/${product.id}'),
                        style: IconButton.styleFrom(
                          minimumSize: const Size(40, 40),
                          backgroundColor: const Color(0xff16803c),
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.arrow_forward_rounded, size: 19),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xffeaf6ee),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _quantityButton(
                              icon: Icons.remove,
                              label: 'Decrease quantity',
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .decrement(product.id),
                            ),
                            ConstrainedBox(
                              constraints: const BoxConstraints(minWidth: 20),
                              child: Text(
                                '$qty',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xff16803c),
                                ),
                              ),
                            ),
                            _quantityButton(
                              icon: Icons.add,
                              label: 'Increase quantity',
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
