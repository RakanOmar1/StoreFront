class AppUser {
  const AppUser({
    required this.id,
    required this.firstname,
    required this.lastname,
    this.name,
    this.email,
    this.phone,
    this.address,
    this.city,
    this.latitude,
    this.longitude,
    this.avatarUrl,
    this.role,
  });
  final int id;
  final String firstname, lastname;
  final String? name, email, phone, address, city, avatarUrl, role;
  final double? latitude, longitude;
  String get fullName =>
      name?.trim().isNotEmpty == true ? name! : ('$firstname $lastname').trim();
  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
    id: int.tryParse('${j['id']}') ?? 0,
    firstname: j['firstname']?.toString() ?? '',
    lastname: j['lastname']?.toString() ?? '',
    name: j['name']?.toString(),
    email: j['email']?.toString(),
    phone: j['phone']?.toString(),
    address: j['address']?.toString(),
    city: j['city']?.toString(),
    latitude: double.tryParse('${j['latitude'] ?? ''}'),
    longitude: double.tryParse('${j['longitude'] ?? ''}'),
    avatarUrl: j['avatar_url']?.toString(),
    role: j['role']?.toString(),
  );
  Map<String, dynamic> toJson() => {
    'id': id,
    'firstname': firstname,
    'lastname': lastname,
    'name': name,
    'email': email,
    'phone': phone,
    'address': address,
    'city': city,
    'latitude': latitude,
    'longitude': longitude,
    'avatar_url': avatarUrl,
    'role': role,
  };
}

class AuthState {
  const AuthState({this.user, this.loading = false, this.error});
  final AppUser? user;
  final bool loading;
  final String? error;
  bool get authenticated => user != null;
  AuthState copyWith({
    AppUser? user,
    bool? loading,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) => AuthState(
    user: clearUser ? null : user ?? this.user,
    loading: loading ?? this.loading,
    error: clearError ? null : error ?? this.error,
  );
}
