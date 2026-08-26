import 'package:carousel_slider/carousel_slider.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/providers.dart';
import '../../../shared/widgets/product_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productsProvider);
    final categories = ref.watch(categoriesProvider);
    final animationsEnabled = ref.watch(animationsEnabledProvider);
    return RefreshIndicator(
      onRefresh: () => ref.refresh(productsProvider.future),
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: const Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.red,
                  child: Text(
                    '7',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                SizedBox(width: 9),
                Text(
                  'Stars Mall',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ],
            ),
            actions: [
              IconButton(
                onPressed: () {
                  context.setLocale(
                    context.locale.languageCode == 'ar'
                        ? const Locale('en')
                        : const Locale('ar'),
                  );
                },
                icon: const Icon(Icons.language),
              ),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.notifications_none),
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      color: AppColors.green,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'delivery'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  readOnly: true,
                  onTap: () => context.go('/search'),
                  decoration: InputDecoration(
                    hintText: 'search'.tr(),
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: const Icon(Icons.tune),
                  ),
                ),
                const SizedBox(height: 18),
                CarouselSlider(
                  items: [
                    _banner(
                      context,
                      'Fresh groceries',
                      'Everyday value',
                      AppColors.green,
                    ),
                    _banner(
                      context,
                      'Weekend deals',
                      'Save on mall picks',
                      AppColors.navy,
                    ),
                    _banner(
                      context,
                      'Fast delivery',
                      'Right to your door',
                      AppColors.orange,
                    ),
                  ],
                  options: CarouselOptions(
                    height: 174,
                    autoPlay: animationsEnabled,
                    autoPlayInterval: const Duration(seconds: 5),
                    viewportFraction: 1,
                    enableInfiniteScroll: true,
                  ),
                ),
                const SizedBox(height: 24),
                _title('categories'.tr()),
                const SizedBox(height: 12),
                SizedBox(
                  height: 90,
                  child: categories.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (_, _) => Center(
                      child: TextButton(
                        onPressed: () => ref.invalidate(categoriesProvider),
                        child: const Text('Retry'),
                      ),
                    ),
                    data: (values) => ListView(
                      scrollDirection: Axis.horizontal,
                      children: values
                          .take(8)
                          .map(
                            (category) => Padding(
                              padding: const EdgeInsetsDirectional.only(
                                end: 10,
                              ),
                              child: InkWell(
                                onTap: () => context.push(
                                  '/categories/${category.id}',
                                  extra: category,
                                ),
                                child: Column(
                                  children: [
                                    CircleAvatar(
                                      radius: 28,
                                      backgroundColor: const Color(0xffeaf6ee),
                                      child: Icon(
                                        _icon(category.name),
                                        color: AppColors.green,
                                      ),
                                    ),
                                    const SizedBox(height: 5),
                                    Text(
                                      category.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                _title('mallPicks'.tr()),
                const SizedBox(height: 12),
                products.when(
                  loading: () => const SizedBox(
                    height: 272,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => _error(ref),
                  data: (p) => p.isEmpty
                      ? const SizedBox(
                          height: 180,
                          child: Center(child: Text('No products available')),
                        )
                      : CarouselSlider(
                          items: p
                              .take(12)
                              .map((x) => AppProductCard(product: x))
                              .toList(),
                          options: CarouselOptions(
                            height: 282,
                            viewportFraction: .58,
                            padEnds: false,
                            autoPlay: animationsEnabled && p.length > 1,
                            autoPlayInterval: const Duration(seconds: 4),
                            enableInfiniteScroll: p.length > 2,
                          ),
                        ),
                ),
                const SizedBox(height: 24),
                _title('popular'.tr()),
                const SizedBox(height: 12),
                products.when(
                  loading: () => const LinearProgressIndicator(),
                  error: (e, _) => const SizedBox.shrink(),
                  data: (p) => GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: p.length.clamp(0, 10),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisExtent: 272,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                        ),
                    itemBuilder: (_, i) => AppProductCard(product: p[i]),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _title(String t) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(
        t,
        style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900),
      ),
      TextButton(onPressed: () {}, child: Text('seeAll'.tr())),
    ],
  );
  static Widget _banner(
    BuildContext c,
    String title,
    String sub,
    Color color,
  ) => Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(colors: [color, color.withValues(alpha: .76)]),
      borderRadius: BorderRadius.circular(22),
    ),
    padding: const EdgeInsets.all(22),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 25,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(sub, style: const TextStyle(color: Colors.white70)),
        const SizedBox(height: 14),
        FilledButton(
          onPressed: () {},
          style: FilledButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: color,
          ),
          child: Text('shopNow'.tr()),
        ),
      ],
    ),
  );
  static IconData _icon(String e) =>
      {
        'Fresh': Icons.eco,
        'Bakery': Icons.bakery_dining,
        'Dairy': Icons.water_drop,
        'Drinks': Icons.local_drink,
      }[e] ??
      Icons.cleaning_services;
  static Widget _error(WidgetRef ref) => SizedBox(
    height: 220,
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off, size: 40),
          const SizedBox(height: 8),
          Text('loadError'.tr()),
          TextButton(
            onPressed: () => ref.invalidate(productsProvider),
            child: Text('retry'.tr()),
          ),
        ],
      ),
    ),
  );
}
