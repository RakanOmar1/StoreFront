import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../models/cart_state.dart';
import '../providers/cart_provider.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final notifier = ref.read(cartProvider.notifier);
    if (cart.loading) {
      return Scaffold(
        appBar: AppBar(title: Text('cart'.tr())),
        body: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 4,
          itemBuilder: (context, index) => const Card(
            child: SizedBox(
              height: 128,
              child: Center(child: LinearProgressIndicator()),
            ),
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text('cart'.tr()),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: cart.mutating ? null : () => _clear(context, notifier),
              child: Text(
                'clearCart'.tr(),
                style: const TextStyle(color: AppColors.red),
              ),
            ),
        ],
      ),
      body: cart.error != null && cart.items.isEmpty
          ? _error(context, notifier)
          : cart.items.isEmpty
          ? _empty(context)
          : RefreshIndicator(
              onRefresh: notifier.refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 150),
                children: [
                  ...cart.items.values.map(
                    (line) => AppCartItem(line: line, disabled: cart.mutating),
                  ),
                  CartSummaryCard(cart: cart),
                ],
              ),
            ),
      bottomNavigationBar: cart.items.isEmpty
          ? null
          : CartCheckoutBar(cart: cart),
    );
  }

  Future<void> _clear(BuildContext c, CartNotifier n) async {
    final ok =
        await showDialog<bool>(
          context: c,
          builder: (c) => AlertDialog(
            title: Text('clearCart'.tr()),
            content: Text('clearCartConfirm'.tr()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: Text('cancel'.tr()),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(c, true),
                style: FilledButton.styleFrom(backgroundColor: AppColors.red),
                child: Text('clear'.tr()),
              ),
            ],
          ),
        ) ??
        false;
    if (ok) await n.clear();
  }

  Widget _empty(BuildContext c) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircleAvatar(
            radius: 46,
            backgroundColor: Color(0xffeaf6ee),
            child: Icon(
              Icons.shopping_cart_outlined,
              size: 48,
              color: AppColors.green,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'emptyCartTitle'.tr(),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Text('emptyCartMessage'.tr(), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => c.go('/home'),
            child: Text('startShopping'.tr()),
          ),
        ],
      ),
    ),
  );
  Widget _error(BuildContext c, CartNotifier n) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.error_outline, size: 52),
        Text('cartLoadError'.tr()),
        TextButton(onPressed: n.refresh, child: Text('retry'.tr())),
        TextButton(
          onPressed: () => c.go('/home'),
          child: Text('continueShopping'.tr()),
        ),
      ],
    ),
  );
}

class AppCartItem extends ConsumerWidget {
  const AppCartItem({super.key, required this.line, required this.disabled});
  final CartLine line;
  final bool disabled;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = line.product;
    final money = NumberFormat.simpleCurrency(name: 'ILS');
    return Card(
      key: ValueKey(p.id),
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 84,
                height: 96,
                child: p.image.isEmpty
                    ? const ColoredBox(
                        color: Color(0xffeef3ef),
                        child: Icon(Icons.image_outlined),
                      )
                    : CachedNetworkImage(
                        imageUrl: p.image,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) =>
                            const Icon(Icons.broken_image_outlined),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  Text(
                    p.category,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Text(
                        money.format(p.finalPrice),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      if (p.discounted) ...[
                        const SizedBox(width: 7),
                        Text(
                          money.format(p.price),
                          style: const TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _step(
                        Icons.remove,
                        disabled
                            ? null
                            : () => ref
                                  .read(cartProvider.notifier)
                                  .decrement(p.id),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          '${line.quantity}',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                      _step(
                        Icons.add,
                        disabled
                            ? null
                            : () => ref.read(cartProvider.notifier).add(p),
                      ),
                      const Spacer(),
                      Text(
                        money.format(p.finalPrice * line.quantity),
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              tooltip: 'remove'.tr(),
              onPressed: disabled ? null : () => _remove(context, ref, line),
              icon: const Icon(Icons.delete_outline, color: AppColors.red),
            ),
          ],
        ),
      ),
    );
  }

  Widget _step(IconData i, VoidCallback? on) => InkWell(
    onTap: on,
    borderRadius: BorderRadius.circular(20),
    child: Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: const Color(0xffeaf6ee),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Icon(i, size: 17, color: AppColors.green),
    ),
  );
  Future<void> _remove(BuildContext c, WidgetRef ref, CartLine line) async {
    final ok =
        await showDialog<bool>(
          context: c,
          builder: (c) => AlertDialog(
            title: Text('removeItem'.tr()),
            content: Text('removeItemConfirm'.tr()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: Text('cancel'.tr()),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(c, true),
                child: Text('remove'.tr()),
              ),
            ],
          ),
        ) ??
        false;
    if (!ok) return;
    await ref.read(cartProvider.notifier).remove(line.product.id);
    if (!c.mounted) return;
    ScaffoldMessenger.of(c).showSnackBar(
      SnackBar(
        content: Text('itemRemoved'.tr()),
        action: SnackBarAction(
          label: 'undo'.tr(),
          onPressed: () => ref.read(cartProvider.notifier).restoreLine(line),
        ),
      ),
    );
  }
}

class CartSummaryCard extends StatelessWidget {
  const CartSummaryCard({super.key, required this.cart});
  final CartState cart;
  @override
  Widget build(BuildContext context) {
    final m = NumberFormat.simpleCurrency(name: 'ILS');
    return Card(
      margin: const EdgeInsets.only(top: 10),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'orderSummary'.tr(),
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 14),
            _row('subtotal'.tr(), m.format(cart.subtotal)),
            if (cart.discount > 0)
              _row('discount'.tr(), '-${m.format(cart.discount)}', green: true),
            const Divider(height: 24),
            _row('total'.tr(), m.format(cart.total), bold: true),
          ],
        ),
      ),
    );
  }

  Widget _row(String a, String b, {bool bold = false, bool green = false}) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Expanded(
              child: Text(
                a,
                style: TextStyle(fontWeight: bold ? FontWeight.w900 : null),
              ),
            ),
            Text(
              b,
              style: TextStyle(
                fontSize: bold ? 20 : null,
                fontWeight: bold ? FontWeight.w900 : FontWeight.w600,
                color: green ? AppColors.green : null,
              ),
            ),
          ],
        ),
      );
}

class CartCheckoutBar extends StatelessWidget {
  const CartCheckoutBar({super.key, required this.cart});
  final CartState cart;
  @override
  Widget build(BuildContext context) {
    final m = NumberFormat.simpleCurrency(name: 'ILS');
    return SafeArea(
      top: false,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Color(0x18000000), blurRadius: 16)],
        ),
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'total'.tr(),
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  Text(
                    m.format(cart.total),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: FilledButton(
                onPressed: cart.mutating
                    ? null
                    : () => context.push('/checkout'),
                style: FilledButton.styleFrom(minimumSize: const Size(0, 52)),
                child: Text('checkout'.tr()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
