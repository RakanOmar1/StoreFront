import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/checkout_models.dart';

class OrderConfirmationScreen extends StatelessWidget {
  const OrderConfirmationScreen({super.key, this.response});
  final CheckoutResponse? response;
  @override
  Widget build(BuildContext context) {
    if (response == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('confirmationUnavailable'.tr())),
      );
    }
    final o = response!.order, m = NumberFormat.simpleCurrency(name: 'ILS');
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 50),
            const CircleAvatar(
              radius: 44,
              backgroundColor: Color(0xffeaf6ee),
              child: Icon(Icons.check, size: 48, color: Color(0xff16803c)),
            ),
            const SizedBox(height: 20),
            Text(
              'orderConfirmed'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
            ),
            Text(response!.message, textAlign: TextAlign.center),
            const SizedBox(height: 28),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    _row('orderId'.tr(), '#${o.id}'),
                    _row('total'.tr(), m.format(o.totalAmount)),
                    _row('status'.tr(), o.status),
                    _row('paymentStatus'.tr(), o.paymentStatus),
                    _row(
                      'paymentMethod'.tr(),
                      o.paymentMethod == PaymentMethod.cash
                          ? 'cash'.tr()
                          : 'onlinePayment'.tr(),
                    ),
                    _row(
                      'deliveryMethod'.tr(),
                      o.deliveryType == DeliveryType.delivery
                          ? 'delivery'.tr()
                          : 'pickup'.tr(),
                    ),
                    if (o.deliveryAddress != null)
                      _row('deliveryAddress'.tr(), o.deliveryAddress!),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () => context.go('/home'),
              child: Text('continueShopping'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String a, String b) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(a, style: const TextStyle(color: Colors.grey)),
        ),
        Expanded(
          child: Text(
            b,
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ],
    ),
  );
}
