import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../shared/providers.dart';
import '../../auth/providers/auth_provider.dart';

final customerOrdersProvider = FutureProvider.autoDispose<List<CustomerOrder>>((
  ref,
) async {
  final response = await ref.watch(apiClientProvider).dio.get('/orders');
  return (response.data as List)
      .map(
        (value) =>
            CustomerOrder.fromJson(Map<String, dynamic>.from(value as Map)),
      )
      .toList();
});

final customerOrderProvider = FutureProvider.autoDispose
    .family<CustomerOrder, int>((ref, id) async {
      final response = await ref
          .watch(apiClientProvider)
          .dio
          .get('/orders/$id');
      return CustomerOrder.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    });

class CustomerOrder {
  const CustomerOrder({
    required this.id,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.total,
    required this.deliveryType,
    this.address,
    this.latitude,
    this.longitude,
    this.createdAt,
    this.items = const [],
  });
  final int id;
  final String status, paymentStatus, paymentMethod, deliveryType;
  final double total;
  final String? address, createdAt;
  final double? latitude, longitude;
  final List<Map<String, dynamic>> items;
  bool get cancellable =>
      ['PENDING', 'CONFIRMED'].contains(status.toUpperCase());
  factory CustomerOrder.fromJson(Map<String, dynamic> j) => CustomerOrder(
    id: int.tryParse('${j['id']}') ?? 0,
    status: j['status']?.toString() ?? 'PENDING',
    paymentStatus: j['payment_status']?.toString() ?? 'PENDING',
    paymentMethod: j['payment_method']?.toString() ?? 'CASH',
    total: double.tryParse('${j['total_amount'] ?? 0}') ?? 0,
    deliveryType: j['delivery_type']?.toString() ?? 'DELIVERY',
    address: j['delivery_address']?.toString(),
    latitude: double.tryParse('${j['delivery_latitude'] ?? ''}'),
    longitude: double.tryParse('${j['delivery_longitude'] ?? ''}'),
    createdAt: j['created_at']?.toString(),
    items: (j['items'] as List? ?? const [])
        .map((x) => Map<String, dynamic>.from(x as Map))
        .toList(),
  );
}

class MyOrdersScreen extends ConsumerWidget {
  const MyOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!auth.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          context.go(
            '/auth/login?redirect=${Uri.encodeQueryComponent('/account/orders')}',
          );
        }
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final orders = ref.watch(customerOrdersProvider);
    return Scaffold(
      appBar: AppBar(title: Text('myOrders'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(customerOrdersProvider.future),
        child: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => ListView(
            children: [
              const SizedBox(height: 180),
              _Message(icon: Icons.cloud_off_outlined, text: 'loadError'.tr()),
              Center(
                child: TextButton(
                  onPressed: () => ref.invalidate(customerOrdersProvider),
                  child: Text('retry'.tr()),
                ),
              ),
            ],
          ),
          data: (values) => values.isEmpty
              ? ListView(
                  children: [
                    _Message(
                      icon: Icons.receipt_long_outlined,
                      text: _t(
                        context,
                        'لا توجد طلبات حتى الآن',
                        'No orders yet',
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  itemCount: values.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (_, index) => _OrderCard(order: values[index]),
                ),
        ),
      ),
    );
  }
}

class _OrderCard extends ConsumerWidget {
  const _OrderCard({required this.order});
  final CustomerOrder order;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final money = NumberFormat.simpleCurrency(name: 'ILS');
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          showDragHandle: true,
          builder: (_) => _OrderDetailsSheet(orderId: order.id),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: const Color(0xffeaf6ee),
                    child: Text(
                      '#${order.id}',
                      style: const TextStyle(
                        color: Color(0xff16803c),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _t(
                            context,
                            'الطلب #${order.id}',
                            'Order #${order.id}',
                          ),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 17,
                          ),
                        ),
                        if (order.createdAt != null)
                          Text(
                            order.createdAt!,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  Text(
                    money.format(order.total),
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _StatusChip(status: order.status),
                  const SizedBox(width: 8),
                  Icon(
                    order.deliveryType == 'PICKUP'
                        ? Icons.store_outlined
                        : Icons.local_shipping_outlined,
                    size: 18,
                  ),
                  const Spacer(),
                  const Icon(Icons.chevron_right),
                ],
              ),
              if (order.cancellable) ...[
                const Divider(height: 24),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: TextButton.icon(
                    onPressed: () => _cancel(context, ref),
                    icon: const Icon(Icons.cancel_outlined),
                    label: Text(_t(context, 'إلغاء الطلب', 'Cancel order')),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(_t(c, 'إلغاء الطلب؟', 'Cancel order?')),
        content: Text(
          _t(
            c,
            'يمكن إلغاء الطلب فقط قبل بدء التجهيز.',
            'Orders can only be cancelled before preparation starts.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: Text('cancel'.tr()),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: Text(_t(c, 'تأكيد الإلغاء', 'Confirm cancellation')),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(apiClientProvider).dio.patch('/orders/${order.id}/cancel');
      ref.invalidate(customerOrdersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_t(context, 'تم إلغاء الطلب', 'Order cancelled')),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _t(context, 'تعذر إلغاء الطلب', 'Could not cancel this order'),
            ),
          ),
        );
      }
    }
  }
}

class _OrderDetailsSheet extends ConsumerWidget {
  const _OrderDetailsSheet({required this.orderId});
  final int orderId;
  @override
  Widget build(BuildContext context, WidgetRef ref) => SafeArea(
    child: ref
        .watch(customerOrderProvider(orderId))
        .when(
          loading: () => const SizedBox(
            height: 260,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, _) => SizedBox(
            height: 240,
            child: _RetryOrder(
              onTap: () => ref.invalidate(customerOrderProvider(orderId)),
            ),
          ),
          data: (order) => Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _t(
                      context,
                      'تفاصيل الطلب #${order.id}',
                      'Order #${order.id} details',
                    ),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _StatusChip(status: order.status),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.payments_outlined),
                    title: Text(_t(context, 'حالة الدفع', 'Payment status')),
                    subtitle: Text(
                      '${_paymentMethodLabel(context, order.paymentMethod)} • ${_paymentStatusLabel(context, order.paymentStatus)}',
                    ),
                  ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      order.deliveryType == 'PICKUP'
                          ? Icons.store_outlined
                          : Icons.local_shipping_outlined,
                    ),
                    title: Text(_t(context, 'طريقة الاستلام', 'Fulfilment')),
                    subtitle: Text(
                      order.deliveryType == 'PICKUP'
                          ? _t(context, 'استلام من المتجر', 'Store pickup')
                          : _t(context, 'توصيل إلى العنوان', 'Delivery'),
                    ),
                  ),
                  if (order.address?.isNotEmpty == true)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.location_on_outlined),
                      title: Text(order.address!),
                      trailing:
                          order.latitude != null && order.longitude != null
                          ? IconButton.filledTonal(
                              tooltip: _t(
                                context,
                                'عرض الموقع',
                                'View location',
                              ),
                              onPressed: () => _showOrderMap(context, order),
                              icon: const Icon(Icons.map_outlined),
                            )
                          : null,
                    ),
                  const Divider(),
                  ...order.items.map(
                    (item) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        item['product_name']?.toString() ??
                            _t(context, 'منتج', 'Product'),
                      ),
                      subtitle: Text(
                        '${_t(context, 'الكمية', 'Quantity')}: ${item['quantity'] ?? 0}',
                      ),
                      trailing: Text(
                        NumberFormat.simpleCurrency(
                          name: 'ILS',
                        ).format(double.tryParse('${item['price'] ?? 0}') ?? 0),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
  );
}

Future<void> _showOrderMap(BuildContext context, CustomerOrder order) {
  final point = LatLng(order.latitude!, order.longitude!);
  return showDialog<void>(
    context: context,
    builder: (dialog) => Dialog(
      clipBehavior: Clip.antiAlias,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 720, maxHeight: 620),
        child: Column(
          children: [
            ListTile(
              leading: const Icon(Icons.location_on, color: Color(0xff16803c)),
              title: Text(
                _t(dialog, 'موقع توصيل الطلب', 'Order delivery location'),
              ),
              subtitle: Text(order.address ?? ''),
              trailing: IconButton(
                onPressed: () => Navigator.pop(dialog),
                icon: const Icon(Icons.close),
              ),
            ),
            Expanded(
              child: FlutterMap(
                options: MapOptions(initialCenter: point, initialZoom: 16),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.starsmall.storefront',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: point,
                        width: 54,
                        height: 54,
                        child: const Icon(
                          Icons.location_pin,
                          size: 48,
                          color: Colors.red,
                        ),
                      ),
                    ],
                  ),
                  const RichAttributionWidget(
                    attributions: [
                      TextSourceAttribution('OpenStreetMap contributors'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _RetryOrder extends StatelessWidget {
  const _RetryOrder({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Center(
    child: TextButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.refresh),
      label: Text('retry'.tr()),
    ),
  );
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;
  @override
  Widget build(BuildContext context) {
    final value = status.toUpperCase();
    final color = switch (value) {
      'DELIVERED' => const Color(0xff16803c),
      'CANCELLED' => Colors.red,
      'OUT_FOR_DELIVERY' => Colors.blue,
      _ => Colors.orange,
    };
    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: Chip(
        label: Text(_orderStatusLabel(context, value)),
        side: BorderSide.none,
        backgroundColor: color.withValues(alpha: .12),
        labelStyle: TextStyle(color: color, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 160),
    child: Column(
      children: [Icon(icon, size: 52), const SizedBox(height: 12), Text(text)],
    ),
  );
}

String _t(BuildContext context, String ar, String en) =>
    context.locale.languageCode == 'ar' ? ar : en;

String _orderStatusLabel(BuildContext context, String status) {
  final value = status.toUpperCase();
  final arabic = switch (value) {
    'PENDING' => 'قيد الانتظار',
    'CONFIRMED' => 'تم التأكيد',
    'PREPARING' => 'قيد التجهيز',
    'OUT_FOR_DELIVERY' => 'خرج للتوصيل',
    'DELIVERED' => 'تم التوصيل',
    'CANCELLED' => 'ملغي',
    _ => value.replaceAll('_', ' '),
  };
  return _t(context, arabic, value.replaceAll('_', ' '));
}

String _paymentStatusLabel(BuildContext context, String status) =>
    switch (status.toUpperCase()) {
      'PAID' => _t(context, 'مدفوع', 'Paid'),
      'FAILED' => _t(context, 'فشل الدفع', 'Failed'),
      _ => _t(context, 'بانتظار الدفع', 'Pending'),
    };

String _paymentMethodLabel(BuildContext context, String method) =>
    method.toUpperCase() == 'ONLINE'
    ? _t(context, 'دفع إلكتروني', 'Online payment')
    : _t(context, 'نقداً', 'Cash');
