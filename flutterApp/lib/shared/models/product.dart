class Product {
  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.finalPrice,
    required this.image,
    required this.description,
    this.images = const [],
    this.category = 'Supermarket',
  });
  final int id;
  final String name, image, description, category;
  final double price, finalPrice;
  final List<String> images;
  bool get discounted => finalPrice < price;
  factory Product.fromJson(Map<String, dynamic> j) {
    final images = j['images'];
    return Product(
      id: int.tryParse('${j['id']}') ?? 0,
      name: j['name']?.toString() ?? '7 Stars Product',
      price: double.tryParse('${j['price']}') ?? 0,
      finalPrice:
          double.tryParse(
            '${j['finalPrice'] ?? j['final_price'] ?? j['price']}',
          ) ??
          0,
      image:
          j['url']?.toString() ??
          (images is List && images.isNotEmpty ? images.first.toString() : ''),
      images: images is List
          ? images.map((e) => e.toString()).where((e) => e.isNotEmpty).toList()
          : const [],
      description: j['description']?.toString() ?? '',
      category: j['category']?.toString() ?? 'Supermarket',
    );
  }
  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'price': price,
    'finalPrice': finalPrice,
    'url': image,
    'images': images,
    'description': description,
    'category': category,
  };
}
