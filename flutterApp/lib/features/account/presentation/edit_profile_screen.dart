import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../shared/location_picker.dart';
import 'package:latlong2/latlong.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});
  @override
  ConsumerState<EditProfileScreen> createState() => _EditState();
}

class _EditState extends ConsumerState<EditProfileScreen> {
  final key = GlobalKey<FormState>(),
      name = TextEditingController(),
      phone = TextEditingController(),
      address = TextEditingController(),
      city = TextEditingController();
  bool init = false;
  LatLng? selectedPoint;
  @override
  void dispose() {
    for (final c in [name, phone, address, city]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider), u = auth.user;
    if (u == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!init) {
      init = true;
      name.text = u.fullName;
      phone.text = u.phone ?? '';
      address.text = u.address ?? '';
      city.text = u.city ?? '';
      if (u.latitude != null && u.longitude != null) {
        selectedPoint = LatLng(u.latitude!, u.longitude!);
      }
    }
    return Scaffold(
      appBar: AppBar(title: Text('editProfile'.tr())),
      body: Form(
        key: key,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 45,
                    child: Text(
                      u.firstname.isEmpty ? 'U' : u.firstname[0].toUpperCase(),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: IconButton.filled(
                      onPressed: _photo,
                      icon: const Icon(Icons.camera_alt, size: 18),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _field(name, 'fullName', required: true),
            TextFormField(
              initialValue: u.email ?? '',
              readOnly: true,
              decoration: InputDecoration(
                labelText: 'email'.tr(),
                suffixIcon: const Icon(Icons.lock_outline),
              ),
            ),
            const SizedBox(height: 12),
            _field(phone, 'phone'),
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: Theme.of(context).colorScheme.secondaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: LocationPickerButton(
                  initialPoint: selectedPoint,
                  onSelected: (location) {
                    if (location.address.trim().isNotEmpty) {
                      address.text = location.address;
                    }
                    if (location.city.trim().isNotEmpty) {
                      city.text = location.city;
                    }
                    setState(() => selectedPoint = location.point);
                  },
                ),
              ),
            ),
            _field(address, 'streetAddress'),
            _field(city, 'city'),
            if (auth.error != null)
              Text(auth.error!.tr(), style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: auth.loading ? null : _save,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              child: Text('saveChanges'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String k, {bool required = false}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: c,
          decoration: InputDecoration(labelText: k.tr()),
          validator: (v) => required && (v?.trim().isEmpty ?? true)
              ? 'requiredField'.tr()
              : null,
        ),
      );
  Future<void> _save() async {
    if (!key.currentState!.validate()) return;
    final ok = await ref
        .read(authProvider.notifier)
        .updateProfile(
          name: name.text,
          phone: phone.text,
          address: address.text,
          city: city.text,
          latitude: selectedPoint?.latitude,
          longitude: selectedPoint?.longitude,
        );
    if (ok && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('profileUpdated'.tr())));
      context.pop();
    }
  }

  Future<void> _photo() async {
    await showModalBottomSheet(
      context: context,
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: Text('takePhoto'.tr()),
              onTap: () {
                Navigator.pop(c);
                _pick(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: Text('chooseGallery'.tr()),
              onTap: () {
                Navigator.pop(c);
                _pick(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline),
              title: Text('removePhoto'.tr()),
              onTap: () {
                Navigator.pop(c);
                ref.read(authProvider.notifier).removeAvatar();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pick(ImageSource source) async {
    final file = await ImagePicker().pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1200,
    );
    if (file != null) await ref.read(authProvider.notifier).uploadAvatar(file);
  }
}
