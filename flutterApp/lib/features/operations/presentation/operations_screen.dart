import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:image_picker/image_picker.dart';
import '../../../shared/providers.dart';
import '../../auth/providers/auth_provider.dart';
import 'admin_management_tab.dart';

final operationsOrdersProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
      final response = await ref.watch(apiClientProvider).dio.get('/orders');
      return (response.data as List)
          .map((x) => Map<String, dynamic>.from(x as Map))
          .toList()
          .reversed
          .toList();
    });

final operationsProductsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
      final response = await ref
          .watch(apiClientProvider)
          .dio
          .get('/products', queryParameters: {'limit': 100});
      return (response.data as List)
          .map((x) => Map<String, dynamic>.from(x as Map))
          .toList();
    });

final operationsSummaryProvider = FutureProvider.autoDispose<Map<String, int>>((
  ref,
) async {
  final api = ref.watch(apiClientProvider).dio;
  final values = await Future.wait([
    api.get('/products'),
    api.get('/categories'),
    api.get('/users'),
    api.get('/orders'),
  ]);
  return {
    'products': (values[0].data as List).length,
    'categories': (values[1].data as List).length,
    'users': (values[2].data as List).length,
    'orders': (values[3].data as List).length,
  };
});

class OperationsScreen extends ConsumerWidget {
  const OperationsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final deliveryOnly = auth.user?.role == 'DELIVERY';
    if (auth.user?.role != 'ADMIN' &&
        auth.user?.role != 'MANAGER' &&
        !deliveryOnly) {
      return Scaffold(
        appBar: AppBar(title: Text(_t(context, 'غير مصرح', 'Access denied'))),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              _t(
                context,
                'هذه الصفحة متاحة لإدارة المتجر فقط.',
                'This page is available to store administrators only.',
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }
    final tabs = deliveryOnly
        ? [
            Tab(
              icon: const Icon(Icons.receipt_long_outlined),
              text: _t(context, 'الطلبات', 'Orders'),
            ),
            Tab(
              icon: const Icon(Icons.payments_outlined),
              text: _t(context, 'المدفوعات', 'Payments'),
            ),
            Tab(
              icon: const Icon(Icons.map_outlined),
              text: _t(context, 'التوصيل', 'Delivery'),
            ),
          ]
        : [
            Tab(
              icon: const Icon(Icons.dashboard_outlined),
              text: _t(context, 'نظرة عامة', 'Overview'),
            ),
            Tab(
              icon: const Icon(Icons.receipt_long_outlined),
              text: _t(context, 'الطلبات', 'Orders'),
            ),
            Tab(
              icon: const Icon(Icons.payments_outlined),
              text: _t(context, 'المدفوعات', 'Payments'),
            ),
            Tab(
              icon: const Icon(Icons.inventory_2_outlined),
              text: _t(context, 'المنتجات', 'Products'),
            ),
            Tab(
              icon: const Icon(Icons.settings_outlined),
              text: _t(context, 'الإدارة', 'Manage'),
            ),
            Tab(
              icon: const Icon(Icons.map_outlined),
              text: _t(context, 'التوصيل', 'Delivery'),
            ),
          ];
    final pages = deliveryOnly
        ? const [_OrdersTab(), _PaymentsTab(), _DeliveryMapTab()]
        : const [
            _OverviewTab(),
            _OrdersTab(),
            _PaymentsTab(),
            _ProductsTab(),
            AdminManagementTab(),
            _DeliveryMapTab(),
          ];
    assert(tabs.length == pages.length);
    return DefaultTabController(
      length: tabs.length,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            deliveryOnly
                ? _t(context, 'عمليات التوصيل', 'Delivery operations')
                : _t(context, 'إدارة المتجر', 'Store operations'),
          ),
          bottom: TabBar(
            isScrollable: tabs.length > 4,
            tabAlignment: tabs.length > 4 ? TabAlignment.start : null,
            tabs: tabs,
          ),
        ),
        body: TabBarView(children: pages),
      ),
    );
  }
}

class _ProductsTab extends ConsumerWidget {
  const _ProductsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    body: ref
        .watch(operationsProductsProvider)
        .when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) =>
              _Retry(onTap: () => ref.invalidate(operationsProductsProvider)),
          data: (products) => RefreshIndicator(
            onRefresh: () => ref.refresh(operationsProductsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 90),
              itemCount: products.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (_, index) {
                final product = products[index];
                return Card(
                  margin: EdgeInsets.zero,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    leading: CircleAvatar(
                      radius: 25,
                      backgroundImage: '${product['url'] ?? ''}'.isEmpty
                          ? null
                          : NetworkImage('${product['url']}'),
                      child: '${product['url'] ?? ''}'.isEmpty
                          ? const Icon(Icons.inventory_2_outlined)
                          : null,
                    ),
                    title: Text(
                      '${product['name']}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      '${product['category'] ?? ''} • ₪${product['price'] ?? 0}',
                    ),
                    onTap: () => _showProductDetails(context, ref, product),
                    trailing: const Icon(Icons.chevron_right),
                  ),
                );
              },
            ),
          ),
        ),
    floatingActionButton: FloatingActionButton.extended(
      onPressed: () => _editProduct(context, ref, null),
      icon: const Icon(Icons.add),
      label: Text(_t(context, 'إضافة منتج', 'Add product')),
    ),
  );

  Future<void> _editProduct(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic>? product,
  ) async {
    List<Map<String, dynamic>> categories;
    List<Map<String, dynamic>> brands;
    try {
      final api = ref.read(apiClientProvider).dio;
      final responses = await Future.wait([
        api.get('/categories'),
        api.get('/brands'),
      ]);
      categories = (responses[0].data as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      brands = (responses[1].data as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    } on DioException {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _t(
                context,
                'تعذر تحميل الفئات والعلامات التجارية',
                'Could not load categories and brands',
              ),
            ),
          ),
        );
      }
      return;
    }
    if (!context.mounted) return;
    final name = TextEditingController(
      text: product?['name']?.toString() ?? '',
    );
    final price = TextEditingController(
      text: product?['price']?.toString() ?? '',
    );
    final description = TextEditingController(
      text: product?['description']?.toString() ?? '',
    );
    var selectedCategoryId = int.tryParse('${product?['category_id'] ?? ''}');
    selectedCategoryId ??= categories
        .where((item) => '${item['name']}' == '${product?['category'] ?? ''}')
        .map((item) => int.tryParse('${item['id']}'))
        .whereType<int>()
        .firstOrNull;
    var selectedBrandId = int.tryParse('${product?['brand_id'] ?? ''}');
    XFile? selectedImage;
    final key = GlobalKey<FormState>();
    final save = await showDialog<bool>(
      context: context,
      builder: (dialog) => StatefulBuilder(
        builder: (dialog, setDialogState) => AlertDialog(
          title: Text(
            product == null
                ? _t(dialog, 'إضافة منتج', 'Add product')
                : _t(dialog, 'تعديل المنتج', 'Edit product'),
          ),
          content: SizedBox(
            width: 520,
            child: Form(
              key: key,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _adminField(name, _t(dialog, 'اسم المنتج', 'Product name')),
                    _adminField(
                      price,
                      _t(dialog, 'السعر', 'Price'),
                      number: true,
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: DropdownButtonFormField<int>(
                        initialValue: selectedCategoryId,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: _t(dialog, 'الفئة', 'Category'),
                          prefixIcon: const Icon(Icons.category_outlined),
                        ),
                        items: categories
                            .map(
                              (item) => DropdownMenuItem(
                                value: int.parse('${item['id']}'),
                                child: Text(
                                  '${item['name']}',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setDialogState(() => selectedCategoryId = value),
                        validator: (value) => value == null
                            ? _t(
                                dialog,
                                'اختر فئة للمنتج',
                                'Choose a product category',
                              )
                            : null,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: DropdownButtonFormField<int?>(
                        initialValue: selectedBrandId,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: _t(dialog, 'العلامة التجارية', 'Brand'),
                          prefixIcon: const Icon(Icons.sell_outlined),
                        ),
                        items: [
                          DropdownMenuItem<int?>(
                            value: null,
                            child: Text(_t(dialog, 'بدون علامة', 'No brand')),
                          ),
                          ...brands.map(
                            (item) => DropdownMenuItem<int?>(
                              value: int.parse('${item['id']}'),
                              child: Text(
                                '${item['name']}',
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                        ],
                        onChanged: (value) =>
                            setDialogState(() => selectedBrandId = value),
                      ),
                    ),
                    _adminField(
                      description,
                      _t(dialog, 'الوصف', 'Description'),
                      required: false,
                    ),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(
                          dialog,
                        ).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if ('${product?['url'] ?? ''}'.isNotEmpty)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                '${product!['url']}',
                                height: 120,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const SizedBox(
                                  height: 80,
                                  child: Icon(Icons.broken_image_outlined),
                                ),
                              ),
                            ),
                          if (selectedImage != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                selectedImage!.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: () async {
                              final file = await ImagePicker().pickImage(
                                source: ImageSource.gallery,
                                imageQuality: 85,
                                maxWidth: 1600,
                              );
                              if (file != null) {
                                setDialogState(() => selectedImage = file);
                              }
                            },
                            icon: const Icon(Icons.upload_outlined),
                            label: Text(
                              _t(dialog, 'اختيار صورة', 'Choose image'),
                            ),
                          ),
                          Text(
                            _t(
                              dialog,
                              'سيتم ربط رفع الصور بالتخزين لاحقاً.',
                              'Image upload storage will be connected later.',
                            ),
                            textAlign: TextAlign.center,
                            style: Theme.of(dialog).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialog, false),
              child: Text('cancel'.tr()),
            ),
            FilledButton(
              onPressed: () {
                if (key.currentState!.validate()) Navigator.pop(dialog, true);
              },
              child: Text(_t(dialog, 'حفظ', 'Save')),
            ),
          ],
        ),
      ),
    );
    if (save == true) {
      final categoryRecord = categories.firstWhere(
        (item) => int.parse('${item['id']}') == selectedCategoryId,
      );
      final payload = {
        ...?product,
        'name': name.text.trim(),
        'price': double.parse(price.text),
        'category': '${categoryRecord['name']}',
        'category_id': selectedCategoryId,
        'brand_id': selectedBrandId,
        'description': description.text.trim(),
        'url': product?['url'],
      };
      final api = ref.read(apiClientProvider).dio;
      try {
        if (product == null) {
          await api.post('/products', data: payload);
        } else {
          await api.put('/products/${product['id']}', data: payload);
        }
        ref.invalidate(operationsProductsProvider);
        ref.invalidate(operationsSummaryProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_t(context, 'تم حفظ المنتج', 'Product saved')),
            ),
          );
        }
      } on DioException catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.response?.data is String
                    ? '${error.response?.data}'
                    : _t(context, 'تعذر حفظ المنتج', 'Could not save product'),
              ),
            ),
          );
        }
      }
    }
    name.dispose();
    price.dispose();
    description.dispose();
  }

  Future<void> _showProductDetails(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> product,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheet) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if ('${product['url'] ?? ''}'.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.network(
                    '${product['url']}',
                    height: 230,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const SizedBox(
                      height: 150,
                      child: Icon(Icons.broken_image_outlined, size: 48),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text(
                '${product['name']}',
                style: Theme.of(sheet).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(label: Text('${product['category'] ?? ''}')),
                  Chip(label: Text('₪${product['price'] ?? 0}')),
                  if ('${product['brand'] ?? ''}'.isNotEmpty)
                    Chip(label: Text('${product['brand']}')),
                ],
              ),
              if ('${product['description'] ?? ''}'.trim().isNotEmpty) ...[
                const SizedBox(height: 10),
                Text('${product['description']}'),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _deleteProduct(sheet, ref, product),
                      icon: const Icon(Icons.delete_outline),
                      label: Text(_t(sheet, 'حذف', 'Delete')),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () {
                        Navigator.pop(sheet);
                        _editProduct(context, ref, product);
                      },
                      icon: const Icon(Icons.edit_outlined),
                      label: Text(_t(sheet, 'تعديل', 'Edit')),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _adminField(
    TextEditingController controller,
    String label, {
    bool required = true,
    bool number = false,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: TextFormField(
      controller: controller,
      keyboardType: number
          ? const TextInputType.numberWithOptions(decimal: true)
          : null,
      decoration: InputDecoration(labelText: label),
      validator: (value) {
        if (required && (value?.trim().isEmpty ?? true)) {
          return 'requiredField'.tr();
        }
        if (number &&
            (double.tryParse(value ?? '') == null ||
                double.parse(value!) < 0)) {
          return 'Invalid price';
        }
        return null;
      },
    ),
  );

  Future<void> _deleteProduct(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> product,
  ) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(_t(dialog, 'حذف المنتج؟', 'Delete product?')),
        content: Text('${product['name']}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialog, false),
            child: Text('cancel'.tr()),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialog, true),
            child: Text(_t(dialog, 'حذف', 'Delete')),
          ),
        ],
      ),
    );
    if (ok == true) {
      try {
        await ref
            .read(apiClientProvider)
            .dio
            .delete('/products/${product['id']}');
        ref.invalidate(operationsProductsProvider);
        ref.invalidate(operationsSummaryProvider);
      } on DioException catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.response?.data is String
                    ? '${error.response?.data}'
                    : _t(
                        context,
                        'تعذر حذف المنتج',
                        'Could not delete product',
                      ),
              ),
            ),
          );
        }
      }
    }
  }
}

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref
      .watch(operationsSummaryProvider)
      .when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) =>
            _Retry(onTap: () => ref.invalidate(operationsSummaryProvider)),
        data: (data) => RefreshIndicator(
          onRefresh: () => ref.refresh(operationsSummaryProvider.future),
          child: GridView(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 260,
              mainAxisExtent: 145,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            children: [
              _Metric(
                icon: Icons.inventory_2_outlined,
                label: _t(context, 'المنتجات', 'Products'),
                value: data['products'] ?? 0,
                color: Colors.green,
              ),
              _Metric(
                icon: Icons.category_outlined,
                label: _t(context, 'الفئات', 'Categories'),
                value: data['categories'] ?? 0,
                color: Colors.purple,
              ),
              _Metric(
                icon: Icons.people_outline,
                label: _t(context, 'المستخدمون', 'Users'),
                value: data['users'] ?? 0,
                color: Colors.blue,
              ),
              _Metric(
                icon: Icons.receipt_long_outlined,
                label: _t(context, 'الطلبات', 'Orders'),
                value: data['orders'] ?? 0,
                color: Colors.orange,
              ),
            ],
          ),
        ),
      );
}

class _PaymentsTab extends ConsumerStatefulWidget {
  const _PaymentsTab();

  @override
  ConsumerState<_PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends ConsumerState<_PaymentsTab> {
  String filter = 'ALL';

  @override
  Widget build(BuildContext context) => ref
      .watch(operationsOrdersProvider)
      .when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) =>
            _Retry(onTap: () => ref.invalidate(operationsOrdersProvider)),
        data: (orders) {
          final deliveryOnly = ref.read(authProvider).user?.role == 'DELIVERY';
          final visible = filter == 'ALL'
              ? orders
              : orders
                    .where(
                      (order) =>
                          '${order['payment_status']}'.toUpperCase() == filter,
                    )
                    .toList();
          double totalFor(String status) => orders
              .where(
                (order) => '${order['payment_status']}'.toUpperCase() == status,
              )
              .fold(
                0,
                (sum, order) =>
                    sum + (double.tryParse('${order['total_amount']}') ?? 0),
              );
          int countFor(String status) => orders
              .where(
                (order) => '${order['payment_status']}'.toUpperCase() == status,
              )
              .length;
          return RefreshIndicator(
            onRefresh: () => ref.refresh(operationsOrdersProvider.future),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: MediaQuery.sizeOf(context).width > 700
                              ? 4
                              : 2,
                          childAspectRatio: 1.75,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          children: [
                            _PaymentMetric(
                              label: _t(context, 'تم التحصيل', 'Collected'),
                              amount: totalFor('PAID'),
                              count: countFor('PAID'),
                              color: Colors.green,
                              icon: Icons.check_circle_outline,
                            ),
                            _PaymentMetric(
                              label: _t(context, 'قيد الانتظار', 'Pending'),
                              amount: totalFor('PENDING'),
                              count: countFor('PENDING'),
                              color: Colors.orange,
                              icon: Icons.schedule_outlined,
                            ),
                            if (!deliveryOnly) ...[
                              _PaymentMetric(
                                label: _t(context, 'فشل الدفع', 'Failed'),
                                amount: totalFor('FAILED'),
                                count: countFor('FAILED'),
                                color: Colors.red,
                                icon: Icons.error_outline,
                              ),
                              _PaymentMetric(
                                label: _t(context, 'مسترد', 'Refunded'),
                                amount: totalFor('REFUNDED'),
                                count: countFor('REFUNDED'),
                                color: Colors.blue,
                                icon: Icons.replay_outlined,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: filter,
                          decoration: InputDecoration(
                            labelText: _t(
                              context,
                              'تصفية حسب حالة الدفع',
                              'Filter by payment status',
                            ),
                            prefixIcon: const Icon(Icons.filter_list),
                          ),
                          items:
                              (deliveryOnly
                                      ? const ['ALL', 'PENDING', 'PAID']
                                      : const [
                                          'ALL',
                                          'PENDING',
                                          'PAID',
                                          'FAILED',
                                          'REFUNDED',
                                        ])
                                  .map(
                                    (status) => DropdownMenuItem(
                                      value: status,
                                      child: Text(
                                        status == 'ALL'
                                            ? _t(
                                                context,
                                                'كل المدفوعات',
                                                'All payments',
                                              )
                                            : _paymentStatusLabel(
                                                context,
                                                status,
                                              ),
                                      ),
                                    ),
                                  )
                                  .toList(),
                          onChanged: (value) =>
                              setState(() => filter = value ?? 'ALL'),
                        ),
                      ],
                    ),
                  ),
                ),
                if (visible.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Text(
                        _t(context, 'لا توجد مدفوعات', 'No payments found'),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 28),
                    sliver: SliverList.separated(
                      itemCount: visible.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, index) {
                        final order = visible[index];
                        final paymentStatus =
                            '${order['payment_status'] ?? 'PENDING'}';
                        final canCollectCash =
                            deliveryOnly &&
                            order['payment_method'] == 'CASH' &&
                            paymentStatus != 'PAID' &&
                            order['status'] != 'CANCELLED';
                        return Card(
                          margin: EdgeInsets.zero,
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 7,
                            ),
                            leading: CircleAvatar(
                              child: Text('#${order['id']}'),
                            ),
                            title: Text(
                              '₪${order['total_amount'] ?? 0}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            subtitle: Text(
                              '${_paymentMethodLabel(context, '${order['payment_method'] ?? ''}')} • ${_paymentStatusLabel(context, paymentStatus)}',
                            ),
                            onTap: () => _OrdersTab()._showOrderDetails(
                              context,
                              ref,
                              order,
                            ),
                            trailing: deliveryOnly
                                ? canCollectCash
                                      ? FilledButton.tonalIcon(
                                          onPressed: () => _collectCash(order),
                                          icon: const Icon(
                                            Icons.payments_outlined,
                                          ),
                                          label: Text(
                                            _t(context, 'تحصيل', 'Collect'),
                                          ),
                                        )
                                      : Icon(
                                          paymentStatus == 'PAID'
                                              ? Icons.check_circle
                                              : Icons.schedule,
                                          color: paymentStatus == 'PAID'
                                              ? Colors.green
                                              : Colors.orange,
                                        )
                                : PopupMenuButton<String>(
                                    tooltip: _t(
                                      context,
                                      'تغيير حالة الدفع',
                                      'Change payment status',
                                    ),
                                    onSelected: (status) =>
                                        _updatePayment(order, status),
                                    itemBuilder: (_) => [
                                      for (final status in const [
                                        'PENDING',
                                        'PAID',
                                        'FAILED',
                                        'REFUNDED',
                                      ])
                                        PopupMenuItem(
                                          value: status,
                                          enabled: status != paymentStatus,
                                          child: Text(
                                            _paymentStatusLabel(
                                              context,
                                              status,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      );

  Future<void> _collectCash(Map<String, dynamic> order) async {
    final confirmed = await _OrdersTab()._confirmCashCollection(context, order);
    if (!confirmed || !mounted) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .patch(
            '/orders/${order['id']}/delivery',
            data: {'payment_status': 'PAID'},
          );
      ref.invalidate(operationsOrdersProvider);
      ref.invalidate(mappedOrdersProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _t(
                context,
                'تم تسجيل استلام المبلغ النقدي',
                'Cash payment recorded',
              ),
            ),
          ),
        );
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _t(
                context,
                'تعذر تسجيل الدفعة النقدية',
                'Could not record the cash payment',
              ),
            ),
          ),
        );
      }
    }
  }

  Future<void> _updatePayment(Map<String, dynamic> order, String status) async {
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .put(
            '/orders/${order['id']}',
            data: {...order, 'payment_status': status},
          );
      ref.invalidate(operationsOrdersProvider);
      ref.invalidate(operationsSummaryProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _t(context, 'تم تحديث حالة الدفع', 'Payment status updated'),
            ),
          ),
        );
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _t(
                context,
                'تعذر تحديث حالة الدفع',
                'Could not update payment status',
              ),
            ),
          ),
        );
      }
    }
  }
}

class _PaymentMetric extends StatelessWidget {
  const _PaymentMetric({
    required this.label,
    required this.amount,
    required this.count,
    required this.color,
    required this.icon,
  });

  final String label;
  final double amount;
  final int count;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Card(
    color: color.withValues(alpha: .10),
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            '₪${amount.toStringAsFixed(2)}',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
          Text('$count', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    ),
  );
}

class _OrdersTab extends ConsumerWidget {
  const _OrdersTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref
      .watch(operationsOrdersProvider)
      .when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) =>
            _Retry(onTap: () => ref.invalidate(operationsOrdersProvider)),
        data: (orders) => RefreshIndicator(
          onRefresh: () => ref.refresh(operationsOrdersProvider.future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, index) {
              final order = orders[index];
              final status = order['status']?.toString() ?? 'PENDING';
              final paymentStatus =
                  order['payment_status']?.toString() ?? 'PENDING';
              final isDeliveryUser =
                  ref.read(authProvider).user?.role == 'DELIVERY';
              final canCollectCash =
                  isDeliveryUser &&
                  order['delivery_type'] == 'DELIVERY' &&
                  order['payment_method'] == 'CASH' &&
                  paymentStatus != 'PAID' &&
                  status != 'CANCELLED';
              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => _showOrderDetails(context, ref, order),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xffb8efc4),
                              foregroundColor: const Color(0xff07542b),
                              child: Text('#${order['id']}'),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _t(
                                  context,
                                  'طلب العميل #${order['user_id']}',
                                  'Customer #${order['user_id']} order',
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            const Icon(Icons.chevron_right),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.local_shipping_outlined, size: 18),
                            const SizedBox(width: 7),
                            Expanded(
                              child: Text(
                                '${_deliveryTypeLabel(context, '${order['delivery_type'] ?? ''}')} • ${order['delivery_address'] ?? _t(context, 'استلام من المتجر', 'Store pickup')}',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Chip(label: Text(_statusLabel(context, status))),
                            const SizedBox(width: 8),
                            Chip(
                              avatar: Icon(
                                paymentStatus == 'PAID'
                                    ? Icons.check_circle_outline
                                    : Icons.payments_outlined,
                                size: 17,
                              ),
                              label: Text(
                                _paymentStatusLabel(context, paymentStatus),
                              ),
                            ),
                            const Spacer(),
                            TextButton.icon(
                              onPressed: () =>
                                  _showOrderDetails(context, ref, order),
                              icon: const Icon(Icons.visibility_outlined),
                              label: Text(
                                _t(context, 'عرض التفاصيل', 'View details'),
                              ),
                            ),
                          ],
                        ),
                        if (canCollectCash) ...[
                          const SizedBox(height: 8),
                          FilledButton.icon(
                            onPressed: () async {
                              final confirmed = await _confirmCashCollection(
                                context,
                                order,
                              );
                              if (!confirmed) return;
                              await _collectPayment(ref, order);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      _t(
                                        context,
                                        'تم تسجيل استلام المبلغ النقدي',
                                        'Cash payment recorded',
                                      ),
                                    ),
                                  ),
                                );
                              }
                            },
                            icon: const Icon(Icons.payments_outlined),
                            label: Text(
                              _t(
                                context,
                                'استلام المبلغ النقدي',
                                'Collect cash',
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );

  Future<void> _showOrderDetails(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> summary,
  ) async {
    final future = ref
        .read(apiClientProvider)
        .dio
        .get('/orders/${summary['id']}');
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheet) => SafeArea(
        child: FutureBuilder<Response<dynamic>>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const SizedBox(
                height: 320,
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError || snapshot.data?.data is! Map) {
              return SizedBox(
                height: 260,
                child: Center(
                  child: Text(
                    _t(
                      context,
                      'تعذر تحميل تفاصيل الطلب',
                      'Could not load order details',
                    ),
                  ),
                ),
              );
            }
            final order = Map<String, dynamic>.from(snapshot.data!.data as Map);
            final items = (order['items'] as List? ?? const [])
                .map((item) => Map<String, dynamic>.from(item as Map))
                .toList();
            final status = order['status']?.toString() ?? 'PENDING';
            final canEditItems = [
              'ADMIN',
              'MANAGER',
            ].contains(ref.read(authProvider).user?.role);
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _t(
                      context,
                      'تفاصيل الطلب #${order['id']}',
                      'Order #${order['id']} details',
                    ),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _detailRow(
                    Icons.person_outline,
                    _t(context, 'العميل', 'Customer'),
                    '#${order['user_id']}',
                  ),
                  _detailRow(
                    Icons.payments_outlined,
                    _t(context, 'الإجمالي', 'Total'),
                    '₪${order['total_amount'] ?? 0}',
                  ),
                  _detailRow(
                    Icons.account_balance_wallet_outlined,
                    _t(context, 'الدفع', 'Payment'),
                    '${_paymentMethodLabel(context, '${order['payment_method'] ?? ''}')} • ${_paymentStatusLabel(context, '${order['payment_status'] ?? ''}')}',
                  ),
                  if (order['delivery_type'] == 'DELIVERY' &&
                      order['payment_method'] == 'CASH' &&
                      order['payment_status'] != 'PAID') ...[
                    FilledButton.icon(
                      onPressed: () async {
                        await _collectPayment(ref, order);
                        if (sheet.mounted) Navigator.pop(sheet);
                      },
                      icon: const Icon(Icons.payments_outlined),
                      label: Text(
                        _t(
                          context,
                          'تم استلام المبلغ النقدي',
                          'Collect cash and mark paid',
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  _detailRow(
                    Icons.location_on_outlined,
                    _t(context, 'التوصيل', 'Delivery'),
                    '${_deliveryTypeLabel(context, '${order['delivery_type'] ?? ''}')} • ${order['delivery_address'] ?? _t(context, 'استلام من المتجر', 'Store pickup')}',
                  ),
                  const Divider(height: 28),
                  Text(
                    _t(context, 'المنتجات', 'Products'),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...items.map(
                    (item) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        '${item['product_name'] ?? _t(context, 'منتج', 'Product')}',
                      ),
                      subtitle: Text(
                        '${_t(context, 'الكمية', 'Quantity')}: ${item['quantity'] ?? 0}',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('₪${item['price'] ?? 0}'),
                          if (canEditItems)
                            PopupMenuButton<String>(
                              onSelected: (action) async {
                                final changed = action == 'quantity'
                                    ? await _changeOrderItemQuantity(
                                        context,
                                        ref,
                                        order,
                                        item,
                                      )
                                    : await _removeOrderItem(
                                        context,
                                        ref,
                                        order,
                                        item,
                                      );
                                if (changed && sheet.mounted) {
                                  Navigator.pop(sheet);
                                }
                              },
                              itemBuilder: (_) => [
                                PopupMenuItem(
                                  value: 'quantity',
                                  child: ListTile(
                                    leading: const Icon(Icons.numbers),
                                    title: Text(
                                      _t(
                                        context,
                                        'تغيير الكمية',
                                        'Change quantity',
                                      ),
                                    ),
                                  ),
                                ),
                                PopupMenuItem(
                                  value: 'remove',
                                  child: ListTile(
                                    leading: const Icon(
                                      Icons.delete_outline,
                                      color: Colors.red,
                                    ),
                                    title: Text(_t(context, 'إزالة', 'Remove')),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
                  if (canEditItems) ...[
                    const SizedBox(height: 8),
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        final changed = await _addOrderProduct(
                          context,
                          ref,
                          order,
                        );
                        if (changed && sheet.mounted) Navigator.pop(sheet);
                      },
                      icon: const Icon(Icons.add_shopping_cart_outlined),
                      label: Text(
                        _t(context, 'إضافة منتج للطلب', 'Add product to order'),
                      ),
                    ),
                  ],
                  const Divider(height: 28),
                  DropdownButtonFormField<String>(
                    initialValue: status,
                    decoration: InputDecoration(
                      labelText: _t(context, 'حالة الطلب', 'Order status'),
                      prefixIcon: const Icon(Icons.sync_outlined),
                    ),
                    items:
                        (ref.read(authProvider).user?.role == 'DELIVERY'
                                ? _deliveryStatuses
                                : _orderStatuses)
                            .map(
                              (value) => DropdownMenuItem(
                                value: value,
                                child: Text(_statusLabel(context, value)),
                              ),
                            )
                            .toList(),
                    onChanged: (value) async {
                      if (value == null || value == status) return;
                      await _updateStatus(context, ref, order, value);
                      if (sheet.mounted) Navigator.pop(sheet);
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: const Color(0xff16803c)),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    ),
  );

  static const _orderStatuses = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];
  static const _deliveryStatuses = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> order,
    String status,
  ) async {
    final deliveryUser = ref.read(authProvider).user?.role == 'DELIVERY';
    if (deliveryUser) {
      final shouldCollectCash =
          status == 'DELIVERED' &&
          order['delivery_type'] == 'DELIVERY' &&
          order['payment_method'] == 'CASH' &&
          order['payment_status'] != 'PAID';
      if (shouldCollectCash) {
        final confirmed = await _confirmCashCollection(context, order);
        if (!confirmed) return;
      }
      await ref
          .read(apiClientProvider)
          .dio
          .patch(
            '/orders/${order['id']}/delivery',
            data: {
              'status': status,
              if (shouldCollectCash) 'payment_status': 'PAID',
            },
          );
    } else {
      await ref
          .read(apiClientProvider)
          .dio
          .put('/orders/${order['id']}', data: {...order, 'status': status});
    }
    ref.invalidate(operationsOrdersProvider);
    ref.invalidate(mappedOrdersProvider);
  }

  Future<void> _collectPayment(
    WidgetRef ref,
    Map<String, dynamic> order,
  ) async {
    await ref
        .read(apiClientProvider)
        .dio
        .patch(
          '/orders/${order['id']}/delivery',
          data: {'payment_status': 'PAID'},
        );
    ref.invalidate(operationsOrdersProvider);
    ref.invalidate(mappedOrdersProvider);
  }

  Future<bool> _confirmCashCollection(
    BuildContext context,
    Map<String, dynamic> order,
  ) async {
    final total = order['total_amount'] ?? 0;
    return await showDialog<bool>(
          context: context,
          builder: (dialog) => AlertDialog(
            icon: const Icon(Icons.payments_outlined, size: 34),
            title: Text(
              _t(dialog, 'تأكيد استلام المبلغ', 'Confirm cash collection'),
            ),
            content: Text(
              _t(
                dialog,
                'هل استلمت مبلغ ₪$total نقداً من العميل؟',
                'Did you collect ₪$total in cash from the customer?',
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialog, false),
                child: Text(_t(dialog, 'إلغاء', 'Cancel')),
              ),
              FilledButton.icon(
                onPressed: () => Navigator.pop(dialog, true),
                icon: const Icon(Icons.check),
                label: Text(_t(dialog, 'نعم، تم الاستلام', 'Yes, collected')),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<bool> _changeOrderItemQuantity(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> order,
    Map<String, dynamic> item,
  ) async {
    final quantity = TextEditingController(text: '${item['quantity'] ?? 1}');
    final key = GlobalKey<FormState>();
    final next = await showDialog<int>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(_t(dialog, 'تغيير الكمية', 'Change quantity')),
        content: Form(
          key: key,
          child: TextFormField(
            controller: quantity,
            autofocus: true,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: _t(dialog, 'الكمية', 'Quantity'),
            ),
            validator: (value) {
              final parsed = int.tryParse(value ?? '');
              return parsed == null || parsed < 1
                  ? _t(dialog, 'أدخل كمية صحيحة', 'Enter a valid quantity')
                  : null;
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialog),
            child: Text('cancel'.tr()),
          ),
          FilledButton(
            onPressed: () {
              if (key.currentState!.validate()) {
                Navigator.pop(dialog, int.parse(quantity.text));
              }
            },
            child: Text(_t(dialog, 'حفظ', 'Save')),
          ),
        ],
      ),
    );
    quantity.dispose();
    if (next == null || !context.mounted) return false;
    return _orderItemRequest(
      context,
      ref,
      () => ref
          .read(apiClientProvider)
          .dio
          .patch(
            '/orders/${order['id']}/products/${item['id']}',
            data: {'quantity': next},
          ),
    );
  }

  Future<bool> _removeOrderItem(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> order,
    Map<String, dynamic> item,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(_t(dialog, 'إزالة المنتج؟', 'Remove product?')),
        content: Text('${item['product_name'] ?? ''}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialog, false),
            child: Text('cancel'.tr()),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialog, true),
            child: Text(_t(dialog, 'إزالة', 'Remove')),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return false;
    return _orderItemRequest(
      context,
      ref,
      () => ref
          .read(apiClientProvider)
          .dio
          .delete('/orders/${order['id']}/products/${item['id']}'),
    );
  }

  Future<bool> _addOrderProduct(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> order,
  ) async {
    List<Map<String, dynamic>> products;
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/products', queryParameters: {'limit': 100});
      products = (response.data as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    } on DioException {
      if (context.mounted) {
        _showOrderItemError(context);
      }
      return false;
    }
    if (!context.mounted || products.isEmpty) return false;
    int? productId;
    final quantity = TextEditingController(text: '1');
    final key = GlobalKey<FormState>();
    final payload = await showDialog<Map<String, int>>(
      context: context,
      builder: (dialog) => StatefulBuilder(
        builder: (dialog, setDialogState) => AlertDialog(
          title: Text(_t(dialog, 'إضافة منتج', 'Add product')),
          content: Form(
            key: key,
            child: SizedBox(
              width: 480,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    initialValue: productId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: _t(dialog, 'المنتج', 'Product'),
                    ),
                    items: products
                        .map(
                          (product) => DropdownMenuItem(
                            value: int.parse('${product['id']}'),
                            child: Text(
                              '${product['name']} • ₪${product['price']}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setDialogState(() => productId = value),
                    validator: (value) => value == null
                        ? _t(dialog, 'اختر منتجاً', 'Choose a product')
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: quantity,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: _t(dialog, 'الكمية', 'Quantity'),
                    ),
                    validator: (value) {
                      final parsed = int.tryParse(value ?? '');
                      return parsed == null || parsed < 1
                          ? _t(
                              dialog,
                              'أدخل كمية صحيحة',
                              'Enter a valid quantity',
                            )
                          : null;
                    },
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialog),
              child: Text('cancel'.tr()),
            ),
            FilledButton(
              onPressed: () {
                if (key.currentState!.validate()) {
                  Navigator.pop(dialog, {
                    'product_id': productId!,
                    'quantity': int.parse(quantity.text),
                  });
                }
              },
              child: Text(_t(dialog, 'إضافة', 'Add')),
            ),
          ],
        ),
      ),
    );
    quantity.dispose();
    if (payload == null || !context.mounted) return false;
    return _orderItemRequest(
      context,
      ref,
      () => ref
          .read(apiClientProvider)
          .dio
          .post('/orders/${order['id']}/products', data: payload),
    );
  }

  Future<bool> _orderItemRequest(
    BuildContext context,
    WidgetRef ref,
    Future<Response<dynamic>> Function() request,
  ) async {
    try {
      await request();
      ref.invalidate(operationsOrdersProvider);
      ref.invalidate(operationsSummaryProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_t(context, 'تم تحديث الطلب', 'Order updated')),
          ),
        );
      }
      return true;
    } on DioException {
      if (context.mounted) _showOrderItemError(context);
      return false;
    }
  }

  void _showOrderItemError(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _t(
            context,
            'تعذر تحديث منتجات الطلب',
            'Could not update order products',
          ),
        ),
      ),
    );
  }
}

final mappedOrdersProvider = FutureProvider.autoDispose<List<_MappedOrder>>((
  ref,
) async {
  final orders = await ref.watch(operationsOrdersProvider.future);
  final dio = Dio();
  final mapped = <_MappedOrder>[];
  for (final order
      in orders
          .where(
            (x) =>
                x['delivery_type'] == 'DELIVERY' &&
                '${x['delivery_address'] ?? ''}'.trim().isNotEmpty,
          )
          .take(12)) {
    final latitude = double.tryParse('${order['delivery_latitude'] ?? ''}');
    final longitude = double.tryParse('${order['delivery_longitude'] ?? ''}');
    if (latitude != null && longitude != null) {
      mapped.add(_MappedOrder(order, LatLng(latitude, longitude)));
      continue;
    }
    try {
      final response = await dio.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'format': 'jsonv2',
          'limit': 1,
          'q': order['delivery_address'],
        },
        options: Options(headers: {'User-Agent': 'SevenStarsMall/1.0'}),
      );
      final row = response.data?.firstOrNull as Map?;
      if (row != null) {
        mapped.add(
          _MappedOrder(
            order,
            LatLng(
              double.parse('${row['lat']}'),
              double.parse('${row['lon']}'),
            ),
          ),
        );
      }
    } catch (_) {}
  }
  return mapped;
});

class _DeliveryMapTab extends ConsumerWidget {
  const _DeliveryMapTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref
      .watch(mappedOrdersProvider)
      .when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) =>
            _Retry(onTap: () => ref.invalidate(mappedOrdersProvider)),
        data: (orders) {
          final groups = _groupMappedOrders(orders);
          return Column(
            children: [
              Container(
                width: double.infinity,
                color: const Color(0xffeaf6ee),
                padding: const EdgeInsets.all(12),
                child: Text(
                  _t(
                    context,
                    '${orders.length} طلبات ظاهرة على الخريطة',
                    '${orders.length} orders mapped',
                  ),
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              Expanded(
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: orders.isEmpty
                        ? const LatLng(31.9038, 35.2034)
                        : orders.first.point,
                    initialZoom: orders.length <= 1 ? 16 : 13,
                    initialCameraFit: orders.length > 1
                        ? CameraFit.bounds(
                            bounds: LatLngBounds.fromPoints(
                              orders.map((item) => item.point).toList(),
                            ),
                            padding: const EdgeInsets.all(54),
                            maxZoom: 16,
                          )
                        : null,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.starsmall.storefront',
                    ),
                    MarkerLayer(
                      markers: groups
                          .map(
                            (group) => Marker(
                              point: group.point,
                              width: 48,
                              height: 58,
                              alignment: Alignment.topCenter,
                              child: Tooltip(
                                message: group.orders.length == 1
                                    ? '${group.orders.first['delivery_address']}'
                                    : _t(
                                        context,
                                        '${group.orders.length} طلبات في هذا الموقع',
                                        '${group.orders.length} orders at this location',
                                      ),
                                child: InkWell(
                                  onTap: () => _showGroup(context, ref, group),
                                  borderRadius: BorderRadius.circular(24),
                                  child: Stack(
                                    clipBehavior: Clip.none,
                                    alignment: Alignment.topCenter,
                                    children: [
                                      const Icon(
                                        Icons.location_on,
                                        size: 48,
                                        color: Color(0xff16803c),
                                        shadows: [
                                          Shadow(
                                            color: Color(0x55000000),
                                            blurRadius: 5,
                                            offset: Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      Positioned(
                                        top: 10,
                                        child: Text(
                                          group.orders.length == 1
                                              ? '${group.orders.first['id']}'
                                              : '${group.orders.length}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    RichAttributionWidget(
                      attributions: [
                        TextSourceAttribution('OpenStreetMap contributors'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      );

  List<_MappedOrderGroup> _groupMappedOrders(List<_MappedOrder> orders) {
    final grouped = <String, _MappedOrderGroup>{};
    for (final item in orders) {
      final key =
          '${item.point.latitude.toStringAsFixed(5)}:${item.point.longitude.toStringAsFixed(5)}';
      grouped
          .putIfAbsent(key, () => _MappedOrderGroup(item.point, []))
          .orders
          .add(item.order);
    }
    return grouped.values.toList();
  }

  void _showGroup(
    BuildContext context,
    WidgetRef ref,
    _MappedOrderGroup group,
  ) {
    if (group.orders.length == 1) {
      _OrdersTab()._showOrderDetails(context, ref, group.orders.first);
      return;
    }
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          children: [
            Text(
              _t(context, 'طلبات في هذا الموقع', 'Orders at this location'),
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            ...group.orders.map(
              (order) => ListTile(
                leading: CircleAvatar(child: Text('#${order['id']}')),
                title: Text('${order['delivery_address']}'),
                subtitle: Text(_statusLabel(context, '${order['status']}')),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.pop(context);
                  _OrdersTab()._showOrderDetails(context, ref, order);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MappedOrder {
  const _MappedOrder(this.order, this.point);
  final Map<String, dynamic> order;
  final LatLng point;
}

class _MappedOrderGroup {
  const _MappedOrderGroup(this.point, this.orders);
  final LatLng point;
  final List<Map<String, dynamic>> orders;
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
  final IconData icon;
  final String label;
  final int value;
  final Color color;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: color.withValues(alpha: .12),
            child: Icon(icon, color: color),
          ),
          const Spacer(),
          Text(
            '$value',
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
          ),
          Text(label),
        ],
      ),
    ),
  );
}

class _Retry extends StatelessWidget {
  const _Retry({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Center(
    child: FilledButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.refresh),
      label: Text('retry'.tr()),
    ),
  );
}

String _t(BuildContext context, String ar, String en) =>
    context.locale.languageCode == 'ar' ? ar : en;

String _statusLabel(BuildContext context, String status) {
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

String _deliveryTypeLabel(BuildContext context, String type) =>
    type.toUpperCase() == 'PICKUP'
    ? _t(context, 'استلام', 'Pickup')
    : _t(context, 'توصيل', 'Delivery');
