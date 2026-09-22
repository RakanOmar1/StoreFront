enum DeliveryType { delivery, pickup }

enum PaymentMethod { cash, online }

class CheckoutRequest {
  const CheckoutRequest({
    required this.paymentMethod,
    required this.deliveryType,
    this.deliveryAddress,
    this.deliveryLatitude,
    this.deliveryLongitude,
  });
  final PaymentMethod paymentMethod;
  final DeliveryType deliveryType;
  final String? deliveryAddress;
  final double? deliveryLatitude;
  final double? deliveryLongitude;
  Map<String, dynamic> toJson() => {
    'paymentMethod': paymentMethod == PaymentMethod.cash ? 'CASH' : 'ONLINE',
    'deliveryType': deliveryType == DeliveryType.delivery
        ? 'DELIVERY'
        : 'PICKUP',
    if (deliveryType == DeliveryType.delivery)
      'deliveryAddress': deliveryAddress,
    if (deliveryType == DeliveryType.delivery && deliveryLatitude != null)
      'deliveryLatitude': deliveryLatitude,
    if (deliveryType == DeliveryType.delivery && deliveryLongitude != null)
      'deliveryLongitude': deliveryLongitude,
  };
}

class CheckoutOrder {
  const CheckoutOrder({
    required this.id,
    required this.userId,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.deliveryType,
    this.deliveryAddress,
  });
  final int id, userId;
  final double totalAmount;
  final String status, paymentStatus;
  final PaymentMethod paymentMethod;
  final DeliveryType deliveryType;
  final String? deliveryAddress;
  factory CheckoutOrder.fromJson(Map<String, dynamic> j) {
    final id = int.tryParse('${j['id']}') ?? 0,
        user = int.tryParse('${j['user_id']}') ?? 0,
        total = double.tryParse('${j['total_amount']}');
    if (id == 0 || user == 0 || total == null) {
      throw const FormatException('Malformed order');
    }
    return CheckoutOrder(
      id: id,
      userId: user,
      totalAmount: total,
      status: j['status']?.toString() ?? 'PENDING',
      paymentStatus: j['payment_status']?.toString() ?? 'PENDING',
      paymentMethod: j['payment_method'] == 'ONLINE'
          ? PaymentMethod.online
          : PaymentMethod.cash,
      deliveryType: j['delivery_type'] == 'PICKUP'
          ? DeliveryType.pickup
          : DeliveryType.delivery,
      deliveryAddress: j['delivery_address']?.toString(),
    );
  }
}

class CheckoutResponse {
  const CheckoutResponse({required this.message, required this.order});
  final String message;
  final CheckoutOrder order;
  factory CheckoutResponse.fromJson(Map<String, dynamic> j) {
    if (j['order'] is! Map) {
      throw const FormatException('Malformed checkout response');
    }
    return CheckoutResponse(
      message: j['message']?.toString() ?? '',
      order: CheckoutOrder.fromJson(
        Map<String, dynamic>.from(j['order'] as Map),
      ),
    );
  }
}
