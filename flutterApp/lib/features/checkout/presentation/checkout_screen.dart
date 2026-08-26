import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/checkout_models.dart';
import '../providers/checkout_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutState();
}

class _CheckoutState extends ConsumerState<CheckoutScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController(),
      phone = TextEditingController(),
      address = TextEditingController(),
      city = TextEditingController();
  DeliveryType delivery = DeliveryType.delivery;
  bool initialized = false;
  @override
  void dispose() {
    for (final c in [name, phone, address, city]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final state = ref.watch(checkoutProvider);
    if (!auth.loading && !initialized) {
      initialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (!auth.authenticated) {
          context.go(
            '/auth/login?redirect=${Uri.encodeQueryComponent('/checkout')}',
          );
        } else {
          name.text = auth.user!.fullName;
          phone.text = auth.user!.phone ?? '';
          ref.read(checkoutProvider.notifier).synchronize();
        }
      });
    }
    if (!auth.loading && initialized && !auth.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          context.go(
            '/auth/login?redirect=${Uri.encodeQueryComponent('/checkout')}',
          );
        }
      });
    }
    if (auth.loading ||
        !auth.authenticated ||
        state.status == CheckoutStatus.initial ||
        state.status == CheckoutStatus.synchronizing) {
      return _progress();
    }
    if (state.status == CheckoutStatus.synchronizationFailed) {
      return Scaffold(
        appBar: AppBar(title: Text('checkout'.tr())),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text((state.error ?? 'cartSyncFailed').tr()),
              TextButton(
                onPressed: () =>
                    ref.read(checkoutProvider.notifier).synchronize(),
                child: Text('retry'.tr()),
              ),
            ],
          ),
        ),
      );
    }
    final money = NumberFormat.simpleCurrency(name: 'ILS');
    return Scaffold(
      appBar: AppBar(title: Text('checkout'.tr())),
      body: Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 130),
          children: [
            _section('contactInformation', [
              _field(name, 'fullName'),
              _field(phone, 'phone', type: TextInputType.phone),
            ]),
            _section('deliveryMethod', [
              SegmentedButton<DeliveryType>(
                segments: [
                  ButtonSegment(
                    value: DeliveryType.delivery,
                    label: Text('delivery'.tr()),
                    icon: const Icon(Icons.local_shipping_outlined),
                  ),
                  ButtonSegment(
                    value: DeliveryType.pickup,
                    label: Text('pickup'.tr()),
                    icon: const Icon(Icons.store_outlined),
                  ),
                ],
                selected: {delivery},
                onSelectionChanged: (value) =>
                    setState(() => delivery = value.first),
              ),
            ]),
            if (delivery == DeliveryType.delivery)
              _section('deliveryAddress', [
                _field(address, 'streetAddress', min: 5),
                _field(city, 'city'),
              ]),
            _section('paymentMethod', [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(
                  Icons.check_circle,
                  color: Color(0xff16803c),
                ),
                title: Text('cash'.tr()),
                subtitle: Text('cash'.tr()),
              ),
              ListTile(
                enabled: false,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.credit_card),
                title: Text('onlinePayment'.tr()),
                subtitle: Text('comingSoon'.tr()),
              ),
            ]),
            _section('orderReview', [
              ...state.backendItems.values.map(
                (line) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${line.quantity} × ${line.product.name}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        money.format(line.product.finalPrice * line.quantity),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
              ),
              const Divider(),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'total'.tr(),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Text(
                    money.format(state.total),
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ]),
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  state.error!.tr(),
                  style: const TextStyle(color: Colors.red),
                ),
              ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          color: Colors.white,
          padding: const EdgeInsets.all(12),
          child: FilledButton(
            onPressed: state.busy ? null : _submit,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
            ),
            child: state.status == CheckoutStatus.submitting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text('placeOrder'.tr()),
          ),
        ),
      ),
    );
  }

  Widget _progress() => Scaffold(
    appBar: AppBar(title: Text('checkout'.tr())),
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text('syncingCart'.tr()),
        ],
      ),
    ),
  );
  Widget _section(String title, List<Widget> children) => Card(
    margin: const EdgeInsets.only(bottom: 14),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title.tr(),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    ),
  );
  Widget _field(
    TextEditingController controller,
    String label, {
    TextInputType? type,
    int min = 1,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: controller,
      keyboardType: type,
      decoration: InputDecoration(labelText: label.tr()),
      validator: (value) =>
          (value?.trim().length ?? 0) < min ? 'requiredField'.tr() : null,
    ),
  );
  Future<void> _submit() async {
    if (!formKey.currentState!.validate()) return;
    final deliveryAddress = delivery == DeliveryType.delivery
        ? '${address.text.trim()}, ${city.text.trim()}'
        : null;
    final result = await ref
        .read(checkoutProvider.notifier)
        .submit(
          CheckoutRequest(
            paymentMethod: PaymentMethod.cash,
            deliveryType: delivery,
            deliveryAddress: deliveryAddress,
          ),
        );
    if (result != null && mounted) {
      context.go('/orders/${result.order.id}/confirmation', extra: result);
    }
  }
}
