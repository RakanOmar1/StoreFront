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
            Text(
              o.paymentMethod == PaymentMethod.cash
                  ? _t(
                      context,
                      'ادفع نقداً عند استلام طلبك.',
                      'Pay with cash when you receive your order.',
                    )
                  : response!.message,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    _row('orderId'.tr(), '#${o.id}'),
                    _row('total'.tr(), m.format(o.totalAmount)),
                    _row('status'.tr(), _statusLabel(context, o.status)),
                    _row(
                      'paymentStatus'.tr(),
                      _paymentStatusLabel(context, o.paymentStatus),
                    ),
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

String _statusLabel(BuildContext context, String status) {
  final value = status.toUpperCase();
  return switch (value) {
    'PENDING' => _t(context, 'قيد الانتظار', 'Pending'),
    'CONFIRMED' => _t(context, 'تم التأكيد', 'Confirmed'),
    'PREPARING' => _t(context, 'قيد التجهيز', 'Preparing'),
    'OUT_FOR_DELIVERY' => _t(context, 'خرج للتوصيل', 'Out for delivery'),
    'DELIVERED' => _t(context, 'تم التوصيل', 'Delivered'),
    'CANCELLED' => _t(context, 'ملغي', 'Cancelled'),
    _ => value.replaceAll('_', ' '),
  };
}

String _paymentStatusLabel(BuildContext context, String status) =>
    switch (status.toUpperCase()) {
      'PAID' => _t(context, 'مدفوع', 'Paid'),
      'FAILED' => _t(context, 'فشل الدفع', 'Failed'),
      _ => _t(context, 'بانتظار الدفع', 'Pending'),
    };

String _t(BuildContext context, String ar, String en) =>
    context.locale.languageCode == 'ar' ? ar : en;
