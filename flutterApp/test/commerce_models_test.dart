import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:seven_stars_mall/features/auth/models/app_user.dart';
import 'package:seven_stars_mall/features/cart/models/cart_state.dart';
import 'package:seven_stars_mall/features/checkout/models/checkout_models.dart';
import 'package:seven_stars_mall/shared/models/product.dart';

void main() {
  test('every literal translation key exists in Arabic and English', () {
    final usedKeys = <String>{};
    final pattern = RegExp("'([^']+)'\\.tr\\(\\)");
    for (final entry in Directory('lib').listSync(recursive: true)) {
      if (entry is! File || !entry.path.endsWith('.dart')) continue;
      final source = entry.readAsStringSync();
      usedKeys.addAll(
        pattern.allMatches(source).map((match) => match.group(1)!),
      );
    }

    for (final locale in ['en', 'ar']) {
      final translations = Map<String, dynamic>.from(
        jsonDecode(File('assets/translations/$locale.json').readAsStringSync())
            as Map,
      );
      expect(
        usedKeys.where((key) => !translations.containsKey(key)),
        isEmpty,
        reason: 'Missing $locale translations',
      );
      expect(
        translations.values.where((value) => '$value'.trim().isEmpty),
        isEmpty,
        reason: 'Empty $locale translations',
      );
    }
  });

  group('checkout models', () {
    test('serializes an exact cash delivery location', () {
      const request = CheckoutRequest(
        paymentMethod: PaymentMethod.cash,
        deliveryType: DeliveryType.delivery,
        deliveryAddress: 'Al Manara, Ramallah',
        deliveryLatitude: 31.9038,
        deliveryLongitude: 35.2034,
      );

      expect(request.toJson(), {
        'paymentMethod': 'CASH',
        'deliveryType': 'DELIVERY',
        'deliveryAddress': 'Al Manara, Ramallah',
        'deliveryLatitude': 31.9038,
        'deliveryLongitude': 35.2034,
      });
    });

    test('does not send delivery fields for store pickup', () {
      const request = CheckoutRequest(
        paymentMethod: PaymentMethod.cash,
        deliveryType: DeliveryType.pickup,
        deliveryAddress: 'Must not be sent',
        deliveryLatitude: 31.9,
        deliveryLongitude: 35.2,
      );

      expect(request.toJson(), {
        'paymentMethod': 'CASH',
        'deliveryType': 'PICKUP',
      });
    });

    test('parses decimal totals and fulfillment state', () {
      final response = CheckoutResponse.fromJson({
        'message': 'Created',
        'order': {
          'id': '41',
          'user_id': '7',
          'total_amount': '19.50',
          'status': 'PENDING',
          'payment_status': 'PENDING',
          'payment_method': 'CASH',
          'delivery_type': 'DELIVERY',
          'delivery_address': 'Ramallah',
        },
      });

      expect(response.order.id, 41);
      expect(response.order.totalAmount, 19.5);
      expect(response.order.paymentMethod, PaymentMethod.cash);
      expect(response.order.deliveryType, DeliveryType.delivery);
    });
  });

  test('product and cart calculations preserve discounts', () {
    final product = Product.fromJson({
      'id': 3,
      'name': 'Bananas',
      'price': '6.00',
      'finalPrice': '5.10',
      'images': ['https://example.com/banana.jpg'],
      'category': 'Fresh Produce',
    });
    final cart = CartState(items: {3: CartLine(product: product, quantity: 2)});

    expect(product.image, 'https://example.com/banana.jpg');
    expect(product.discounted, isTrue);
    expect(cart.totalQuantity, 2);
    expect(cart.subtotal, 12);
    expect(cart.total, 10.2);
    expect(cart.discount, closeTo(1.8, 0.0001));
  });

  test('customer profile preserves map coordinates', () {
    final user = AppUser.fromJson({
      'id': 9,
      'firstname': 'Ada',
      'lastname': 'Lovelace',
      'latitude': '31.9038',
      'longitude': '35.2034',
    });

    expect(user.fullName, 'Ada Lovelace');
    expect(user.latitude, 31.9038);
    expect(user.longitude, 35.2034);
    expect(user.toJson()['latitude'], 31.9038);
  });
}
