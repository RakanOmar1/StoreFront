class Category {
  const Category({required this.id, required this.name, this.description});
  final int id;
  final String name;
  final String? description;
  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: int.tryParse('${json['id']}') ?? 0,
    name: json['name']?.toString() ?? '',
    description: json['description']?.toString(),
  );
}
