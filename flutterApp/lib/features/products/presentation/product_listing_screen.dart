import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/product.dart';
import '../../../shared/providers.dart';
import '../../../shared/widgets/product_card.dart';

class ProductListingScreen extends ConsumerStatefulWidget {
  const ProductListingScreen({
    super.key,
    required this.title,
    this.category,
    this.search,
  });
  final String title;
  final String? category, search;
  @override
  ConsumerState<ProductListingScreen> createState() => _ProductListingState();
}

class _ProductListingState extends ConsumerState<ProductListingScreen> {
  final scroll = ScrollController();
  final items = <Product>[];
  bool loading = true, more = true;
  String? error;
  static const size = 20;
  @override
  void initState() {
    super.initState();
    scroll.addListener(_scroll);
    _load(true);
  }

  @override
  void didUpdateWidget(covariant ProductListingScreen old) {
    super.didUpdateWidget(old);
    if (old.search != widget.search || old.category != widget.category) {
      _load(true);
    }
  }

  void _scroll() {
    if (scroll.position.pixels > scroll.position.maxScrollExtent - 350) {
      _load(false);
    }
  }

  Future<void> _load(bool reset) async {
    if (loading && !reset || (!more && !reset)) return;
    if (reset) {
      items.clear();
      more = true;
    }
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final next = await ref
          .read(productRepositoryProvider)
          .products(
            search: widget.search,
            category: widget.category,
            limit: size,
            offset: items.length,
          );
      if (!mounted) return;
      setState(() {
        items.addAll(next);
        more = next.length == size;
        loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          error = 'loadError';
          loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.title)),
    body: RefreshIndicator(
      onRefresh: () => _load(true),
      child: error != null && items.isEmpty
          ? _state(Icons.cloud_off, error!.tr(), () => _load(true))
          : items.isEmpty && !loading
          ? _state(
              Icons.inventory_2_outlined,
              context.locale.languageCode == 'ar'
                  ? 'لم يتم العثور على منتجات'
                  : 'No products found',
              null,
            )
          : GridView.builder(
              controller: scroll,
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
              itemCount: items.length + (loading ? 2 : 0),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisExtent: 328,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemBuilder: (_, i) => i < items.length
                  ? AppProductCard(product: items[i])
                  : const Card(
                      child: Center(child: CircularProgressIndicator()),
                    ),
            ),
    ),
  );
  Widget _state(IconData icon, String message, VoidCallback? retry) => ListView(
    children: [
      SizedBox(
        height: 420,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 56),
            const SizedBox(height: 12),
            Text(message),
            if (retry != null)
              TextButton(onPressed: retry, child: Text('retry'.tr())),
          ],
        ),
      ),
    ],
  );
}
