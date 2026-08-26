import '../../../core/api/api_client.dart';
import '../models/checkout_models.dart';

class CheckoutRepository {
  CheckoutRepository(this.api);
  final ApiClient api;
  Future<CheckoutResponse> place(CheckoutRequest request) async {
    final r = await api.dio.post('/orders/checkout', data: request.toJson());
    return CheckoutResponse.fromJson(Map<String, dynamic>.from(r.data as Map));
  }
}
