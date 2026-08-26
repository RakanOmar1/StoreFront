import '../../../shared/models/product.dart';

class CartLine {
  const CartLine({required this.product, required this.quantity});
  final Product product;
  final int quantity;
  CartLine copyWith({int? quantity}) =>
      CartLine(product: product, quantity: quantity ?? this.quantity);
  Map<String, dynamic> toJson() => {
    'product': product.toJson(),
    'quantity': quantity,
  };
  factory CartLine.fromJson(Map<String, dynamic> j) => CartLine(
    product: Product.fromJson(Map<String, dynamic>.from(j['product'] as Map)),
    quantity: int.tryParse('${j['quantity']}') ?? 1,
  );
}

class CartState {
  const CartState({
    this.items = const {},
    this.loading = false,
    this.mutating = false,
    this.error,
  });
  final Map<int, CartLine> items;
  final bool loading, mutating;
  final String? error;
  int get totalQuantity => items.values.fold(0, (s, e) => s + e.quantity);
  int get distinctCount => items.length;
  double get subtotal =>
      items.values.fold(0, (s, e) => s + (e.product.price * e.quantity));
  double get total =>
      items.values.fold(0, (s, e) => s + (e.product.finalPrice * e.quantity));
  double get discount => subtotal - total;
  CartState copyWith({
    Map<int, CartLine>? items,
    bool? loading,
    bool? mutating,
    String? error,
    bool clearError = false,
  }) => CartState(
    items: items ?? this.items,
    loading: loading ?? this.loading,
    mutating: mutating ?? this.mutating,
    error: clearError ? null : error ?? this.error,
  );
}
