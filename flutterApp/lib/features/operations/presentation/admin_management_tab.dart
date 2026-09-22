import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/providers.dart';

enum AdminEntity { categories, brands, promotions, users }

final adminEntityRecordsProvider = FutureProvider.autoDispose
    .family<List<Map<String, dynamic>>, AdminEntity>((ref, entity) async {
      final response = await ref.watch(apiClientProvider).dio.get(entity.path);
      return (response.data as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    });

class AdminManagementTab extends ConsumerStatefulWidget {
  const AdminManagementTab({super.key});

  @override
  ConsumerState<AdminManagementTab> createState() => _AdminManagementTabState();
}

class _AdminManagementTabState extends ConsumerState<AdminManagementTab> {
  AdminEntity selected = AdminEntity.categories;

  @override
  Widget build(BuildContext context) {
    final records = ref.watch(adminEntityRecordsProvider(selected));
    return Scaffold(
      body: Column(
        children: [
          SizedBox(
            height: 66,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              children: [
                for (final entity in AdminEntity.values)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 8),
                    child: ChoiceChip(
                      selected: selected == entity,
                      avatar: Icon(entity.icon, size: 18),
                      label: Text(entity.label(context)),
                      onSelected: (_) => setState(() => selected = entity),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: records.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) => Center(
                child: FilledButton.icon(
                  onPressed: () =>
                      ref.invalidate(adminEntityRecordsProvider(selected)),
                  icon: const Icon(Icons.refresh),
                  label: Text('retry'.tr()),
                ),
              ),
              data: (items) => items.isEmpty
                  ? _EmptyEntity(entity: selected)
                  : RefreshIndicator(
                      onRefresh: () => ref.refresh(
                        adminEntityRecordsProvider(selected).future,
                      ),
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(12, 12, 12, 90),
                        itemCount: items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (_, index) => _recordCard(items[index]),
                      ),
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _editRecord(null),
        icon: const Icon(Icons.add),
        label: Text(_tx(context, 'إضافة', 'Add')),
      ),
    );
  }

  Widget _recordCard(Map<String, dynamic> item) {
    final inactive = item['is_active'] == false;
    return Card(
      margin: EdgeInsets.zero,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          child: Icon(inactive ? Icons.block_outlined : selected.icon),
        ),
        title: Text(
          selected == AdminEntity.users
              ? '${item['name'] ?? '${item['firstname'] ?? ''} ${item['lastname'] ?? ''}'}'
              : '${item['name'] ?? ''}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Text(
          switch (selected) {
            AdminEntity.categories || AdminEntity.brands =>
              '${item['description'] ?? _tx(context, 'بدون وصف', 'No description')}',
            AdminEntity.promotions =>
              '${_promotionType(context, '${item['type']}')} • ${item['value'] ?? 0}',
            AdminEntity.users =>
              '${_roleLabel(context, '${item['role']}')} • ${item['email'] ?? item['phone'] ?? ''}',
          },
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (action) =>
              action == 'edit' ? _editRecord(item) : _deleteRecord(item),
          itemBuilder: (_) => [
            PopupMenuItem(
              value: 'edit',
              child: ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: Text(_tx(context, 'تعديل', 'Edit')),
              ),
            ),
            PopupMenuItem(
              value: 'delete',
              child: ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: Text(_tx(context, 'تعطيل / حذف', 'Disable / delete')),
              ),
            ),
          ],
        ),
        onTap: () => _editRecord(item),
      ),
    );
  }

  Future<void> _editRecord(Map<String, dynamic>? existing) async {
    var editable = existing;
    if (selected == AdminEntity.promotions && existing != null) {
      try {
        final response = await ref
            .read(apiClientProvider)
            .dio
            .get('${selected.path}/${existing['id']}');
        editable = Map<String, dynamic>.from(response.data as Map);
      } on DioException catch (error) {
        _showError(error);
        return;
      }
    }
    final payload = await switch (selected) {
      AdminEntity.categories ||
      AdminEntity.brands => _showNamedEntityDialog(editable),
      AdminEntity.promotions => _showPromotionDialog(editable),
      AdminEntity.users => _showUserDialog(editable),
    };
    if (payload == null || !mounted) return;
    try {
      final api = ref.read(apiClientProvider).dio;
      if (editable == null) {
        await api.post(selected.path, data: payload);
      } else {
        await api.put('${selected.path}/${editable['id']}', data: payload);
      }
      ref.invalidate(adminEntityRecordsProvider(selected));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_tx(context, 'تم الحفظ', 'Saved'))),
        );
      }
    } on DioException catch (error) {
      _showError(error);
    }
  }

  Future<Map<String, dynamic>?> _showNamedEntityDialog(
    Map<String, dynamic>? existing,
  ) async {
    final name = TextEditingController(text: '${existing?['name'] ?? ''}');
    final description = TextEditingController(
      text: '${existing?['description'] ?? ''}',
    );
    final key = GlobalKey<FormState>();
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(
          existing == null
              ? _tx(
                  dialog,
                  'إضافة ${selected.label(dialog)}',
                  'Add ${selected.label(dialog)}',
                )
              : _tx(
                  dialog,
                  'تعديل ${selected.label(dialog)}',
                  'Edit ${selected.label(dialog)}',
                ),
        ),
        content: Form(
          key: key,
          child: SizedBox(
            width: 460,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: name,
                  decoration: InputDecoration(
                    labelText: _tx(dialog, 'الاسم', 'Name'),
                  ),
                  validator: _required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: description,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: _tx(dialog, 'الوصف', 'Description'),
                  ),
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
                  'name': name.text.trim(),
                  'description': description.text.trim(),
                  if (selected == AdminEntity.brands)
                    'is_active': existing?['is_active'] ?? true,
                });
              }
            },
            child: Text(_tx(dialog, 'حفظ', 'Save')),
          ),
        ],
      ),
    );
    name.dispose();
    description.dispose();
    return result;
  }

  Future<Map<String, dynamic>?> _showPromotionDialog(
    Map<String, dynamic>? existing,
  ) async {
    List<Map<String, dynamic>> products;
    List<Map<String, dynamic>> categories;
    try {
      final api = ref.read(apiClientProvider).dio;
      final responses = await Future.wait([
        api.get('/products', queryParameters: {'limit': 100}),
        api.get('/categories'),
      ]);
      products = (responses[0].data as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      categories = (responses[1].data as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    } on DioException catch (error) {
      _showError(error);
      return null;
    }
    if (!mounted) return null;
    final name = TextEditingController(text: '${existing?['name'] ?? ''}');
    final value = TextEditingController(text: '${existing?['value'] ?? ''}');
    final bundleQuantity = TextEditingController(
      text: '${existing?['bundle_quantity'] ?? ''}',
    );
    final bundlePrice = TextEditingController(
      text: '${existing?['bundle_price'] ?? ''}',
    );
    var type = '${existing?['type'] ?? 'PERCENT'}';
    var active = existing?['is_active'] != false;
    final selectedProductIds = <int>{
      ...(existing?['productIds'] as List? ?? const [])
          .map((id) => int.tryParse('$id'))
          .whereType<int>(),
    };
    final selectedCategoryIds = <int>{
      ...(existing?['categoryIds'] as List? ?? const [])
          .map((id) => int.tryParse('$id'))
          .whereType<int>(),
    };
    final key = GlobalKey<FormState>();
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialog) => StatefulBuilder(
        builder: (dialog, setDialogState) => AlertDialog(
          title: Text(
            existing == null
                ? _tx(dialog, 'إضافة عرض', 'Add promotion')
                : _tx(dialog, 'تعديل العرض', 'Edit promotion'),
          ),
          content: Form(
            key: key,
            child: SizedBox(
              width: 480,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: name,
                      decoration: InputDecoration(
                        labelText: _tx(dialog, 'اسم العرض', 'Promotion name'),
                      ),
                      validator: _required,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: type,
                      decoration: InputDecoration(
                        labelText: _tx(dialog, 'نوع العرض', 'Promotion type'),
                      ),
                      items: const ['PERCENT', 'FIXED', 'BUNDLE']
                          .map(
                            (item) => DropdownMenuItem(
                              value: item,
                              child: Text(_promotionType(dialog, item)),
                            ),
                          )
                          .toList(),
                      onChanged: (next) =>
                          setDialogState(() => type = next ?? type),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: value,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: InputDecoration(
                        labelText: _tx(dialog, 'قيمة الخصم', 'Discount value'),
                      ),
                      validator: _number,
                    ),
                    if (type == 'BUNDLE') ...[
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: bundleQuantity,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: _tx(
                            dialog,
                            'كمية الحزمة',
                            'Bundle quantity',
                          ),
                        ),
                        validator: _number,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: bundlePrice,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: InputDecoration(
                          labelText: _tx(dialog, 'سعر الحزمة', 'Bundle price'),
                        ),
                        validator: _number,
                      ),
                    ],
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      title: Text(_tx(dialog, 'عرض فعال', 'Active promotion')),
                      value: active,
                      onChanged: (next) => setDialogState(() => active = next),
                    ),
                    const Divider(),
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(
                        _tx(dialog, 'الفئات المشمولة', 'Included categories'),
                        style: Theme.of(dialog).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 7,
                      runSpacing: 7,
                      children: [
                        for (final category in categories)
                          FilterChip(
                            label: Text('${category['name']}'),
                            selected: selectedCategoryIds.contains(
                              int.parse('${category['id']}'),
                            ),
                            onSelected: (checked) {
                              final id = int.parse('${category['id']}');
                              setDialogState(
                                () => checked
                                    ? selectedCategoryIds.add(id)
                                    : selectedCategoryIds.remove(id),
                              );
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      title: Text(
                        _tx(dialog, 'منتجات محددة', 'Selected products'),
                      ),
                      subtitle: Text(
                        _tx(
                          dialog,
                          '${selectedProductIds.length} منتجات',
                          '${selectedProductIds.length} selected',
                        ),
                      ),
                      children: [
                        for (final product in products)
                          CheckboxListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            value: selectedProductIds.contains(
                              int.parse('${product['id']}'),
                            ),
                            title: Text(
                              '${product['name']}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text(
                              '${product['category'] ?? ''} • ₪${product['price'] ?? 0}',
                            ),
                            onChanged: (checked) {
                              final id = int.parse('${product['id']}');
                              setDialogState(
                                () => checked == true
                                    ? selectedProductIds.add(id)
                                    : selectedProductIds.remove(id),
                              );
                            },
                          ),
                      ],
                    ),
                  ],
                ),
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
                if (!key.currentState!.validate()) return;
                Navigator.pop(dialog, {
                  ...?existing,
                  'name': name.text.trim(),
                  'type': type,
                  'value': double.parse(value.text),
                  'bundle_quantity': type == 'BUNDLE'
                      ? int.parse(bundleQuantity.text)
                      : null,
                  'bundle_price': type == 'BUNDLE'
                      ? double.parse(bundlePrice.text)
                      : null,
                  'is_active': active,
                  'productIds': selectedProductIds.toList(),
                  'categoryIds': selectedCategoryIds.toList(),
                });
              },
              child: Text(_tx(dialog, 'حفظ', 'Save')),
            ),
          ],
        ),
      ),
    );
    for (final controller in [name, value, bundleQuantity, bundlePrice]) {
      controller.dispose();
    }
    return result;
  }

  Future<Map<String, dynamic>?> _showUserDialog(
    Map<String, dynamic>? existing,
  ) async {
    final first = TextEditingController(
      text: '${existing?['firstname'] ?? ''}',
    );
    final last = TextEditingController(text: '${existing?['lastname'] ?? ''}');
    final email = TextEditingController(text: '${existing?['email'] ?? ''}');
    final phone = TextEditingController(text: '${existing?['phone'] ?? ''}');
    final password = TextEditingController();
    var role = '${existing?['role'] ?? 'CUSTOMER'}';
    final key = GlobalKey<FormState>();
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (dialog) => StatefulBuilder(
        builder: (dialog, setDialogState) => AlertDialog(
          title: Text(
            existing == null
                ? _tx(dialog, 'إضافة مستخدم', 'Add user')
                : _tx(dialog, 'تعديل المستخدم', 'Edit user'),
          ),
          content: Form(
            key: key,
            child: SizedBox(
              width: 480,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: first,
                      decoration: InputDecoration(labelText: 'firstName'.tr()),
                      validator: _required,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: last,
                      decoration: InputDecoration(labelText: 'lastName'.tr()),
                      validator: _required,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: email,
                      decoration: InputDecoration(labelText: 'email'.tr()),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: phone,
                      decoration: InputDecoration(labelText: 'phone'.tr()),
                      validator: (_) =>
                          email.text.trim().isEmpty && phone.text.trim().isEmpty
                          ? _tx(
                              dialog,
                              'أدخل البريد الإلكتروني أو رقم الهاتف',
                              'Enter an email address or phone number',
                            )
                          : null,
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: role,
                      decoration: InputDecoration(
                        labelText: _tx(dialog, 'الدور', 'Role'),
                      ),
                      items: const ['CUSTOMER', 'DELIVERY', 'MANAGER', 'ADMIN']
                          .map(
                            (item) => DropdownMenuItem(
                              value: item,
                              child: Text(_roleLabel(dialog, item)),
                            ),
                          )
                          .toList(),
                      onChanged: (next) =>
                          setDialogState(() => role = next ?? role),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: password,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: existing == null
                            ? 'password'.tr()
                            : _tx(
                                dialog,
                                'كلمة مرور جديدة (اختياري)',
                                'New password (optional)',
                              ),
                      ),
                      validator: (value) {
                        if (existing == null && (value?.length ?? 0) < 6) {
                          return 'passwordMin'.tr();
                        }
                        if ((value?.isNotEmpty ?? false) && value!.length < 6) {
                          return 'passwordMin'.tr();
                        }
                        return null;
                      },
                    ),
                  ],
                ),
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
                if (!key.currentState!.validate()) return;
                Navigator.pop(dialog, {
                  ...?existing,
                  'firstname': first.text.trim(),
                  'lastname': last.text.trim(),
                  'name': '${first.text.trim()} ${last.text.trim()}'.trim(),
                  'email': email.text.trim().isEmpty ? null : email.text.trim(),
                  'phone': phone.text.trim().isEmpty ? null : phone.text.trim(),
                  'role': role,
                  if (password.text.isNotEmpty) 'password': password.text,
                });
              },
              child: Text(_tx(dialog, 'حفظ', 'Save')),
            ),
          ],
        ),
      ),
    );
    for (final controller in [first, last, email, phone, password]) {
      controller.dispose();
    }
    return result;
  }

  Future<void> _deleteRecord(Map<String, dynamic> item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(_tx(dialog, 'تأكيد الإجراء', 'Confirm action')),
        content: Text(
          _tx(
            dialog,
            'هل تريد حذف أو تعطيل هذا السجل؟',
            'Delete or disable this record?',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialog, false),
            child: Text('cancel'.tr()),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialog, true),
            child: Text(_tx(dialog, 'تأكيد', 'Confirm')),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete('${selected.path}/${item['id']}');
      ref.invalidate(adminEntityRecordsProvider(selected));
    } on DioException catch (error) {
      _showError(error);
    }
  }

  void _showError(DioException error) {
    if (!mounted) return;
    final message = error.response?.data is String
        ? '${error.response?.data}'
        : _tx(context, 'تعذر إكمال العملية', 'Could not complete the action');
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String? _required(String? value) =>
      value?.trim().isEmpty ?? true ? 'requiredField'.tr() : null;

  String? _number(String? value) {
    final number = double.tryParse(value ?? '');
    return number == null || number < 0
        ? _tx(context, 'أدخل رقماً صحيحاً', 'Enter a valid number')
        : null;
  }
}

class _EmptyEntity extends StatelessWidget {
  const _EmptyEntity({required this.entity});
  final AdminEntity entity;

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(entity.icon, size: 56, color: Theme.of(context).disabledColor),
        const SizedBox(height: 12),
        Text(_tx(context, 'لا توجد سجلات', 'No records yet')),
      ],
    ),
  );
}

extension on AdminEntity {
  String get path => switch (this) {
    AdminEntity.categories => '/categories',
    AdminEntity.brands => '/brands',
    AdminEntity.promotions => '/promotions',
    AdminEntity.users => '/users',
  };

  IconData get icon => switch (this) {
    AdminEntity.categories => Icons.category_outlined,
    AdminEntity.brands => Icons.sell_outlined,
    AdminEntity.promotions => Icons.percent_outlined,
    AdminEntity.users => Icons.people_outline,
  };

  String label(BuildContext context) => switch (this) {
    AdminEntity.categories => _tx(context, 'الفئات', 'Categories'),
    AdminEntity.brands => _tx(context, 'العلامات', 'Brands'),
    AdminEntity.promotions => _tx(context, 'العروض', 'Promotions'),
    AdminEntity.users => _tx(context, 'المستخدمون', 'Users'),
  };
}

String _promotionType(BuildContext context, String type) =>
    switch (type.toUpperCase()) {
      'FIXED' => _tx(context, 'خصم ثابت', 'Fixed discount'),
      'BUNDLE' => _tx(context, 'حزمة', 'Bundle'),
      _ => _tx(context, 'نسبة مئوية', 'Percentage'),
    };

String _roleLabel(BuildContext context, String role) =>
    switch (role.toUpperCase()) {
      'ADMIN' => _tx(context, 'مدير النظام', 'Admin'),
      'MANAGER' => _tx(context, 'مدير المتجر', 'Manager'),
      'DELIVERY' => _tx(context, 'موظف توصيل', 'Delivery'),
      _ => _tx(context, 'عميل', 'Customer'),
    };

String _tx(BuildContext context, String ar, String en) =>
    context.locale.languageCode == 'ar' ? ar : en;
