import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../shared/location_picker.dart';
import 'package:latlong2/latlong.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.redirect});
  final String? redirect;
  @override
  ConsumerState<LoginScreen> createState() => _LoginState();
}

class _LoginState extends ConsumerState<LoginScreen> {
  final key = GlobalKey<FormState>(),
      id = TextEditingController(),
      password = TextEditingController();
  bool hidden = true;
  @override
  void dispose() {
    id.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return _AuthScaffold(
      title: 'login'.tr(),
      child: Form(
        key: key,
        child: Column(
          children: [
            TextFormField(
              controller: id,
              decoration: InputDecoration(
                labelText: 'identifier'.tr(),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              validator: (v) =>
                  v?.trim().isEmpty ?? true ? 'requiredField'.tr() : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: password,
              obscureText: hidden,
              decoration: InputDecoration(
                labelText: 'password'.tr(),
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  onPressed: () => setState(() => hidden = !hidden),
                  icon: Icon(hidden ? Icons.visibility : Icons.visibility_off),
                ),
              ),
              validator: (v) =>
                  (v?.length ?? 0) < 1 ? 'requiredField'.tr() : null,
            ),
            if (auth.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  auth.error!.tr(),
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: auth.loading
                  ? null
                  : () async {
                      if (!key.currentState!.validate()) return;
                      final ok = await ref
                          .read(authProvider.notifier)
                          .login(id.text, password.text);
                      if (ok && context.mounted) {
                        context.go(widget.redirect ?? '/account');
                      }
                    },
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              child: auth.loading
                  ? const CircularProgressIndicator()
                  : Text('login'.tr()),
            ),
            TextButton(
              onPressed: () => context.push(
                '/auth/register?redirect=${Uri.encodeQueryComponent(widget.redirect ?? '')}',
              ),
              child: Text('createAccount'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key, this.redirect});
  final String? redirect;
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterState();
}

class _RegisterState extends ConsumerState<RegisterScreen> {
  final key = GlobalKey<FormState>(),
      first = TextEditingController(),
      last = TextEditingController(),
      email = TextEditingController(),
      phone = TextEditingController(),
      address = TextEditingController(),
      city = TextEditingController(),
      password = TextEditingController();
  bool passwordHidden = true;
  LatLng? selectedPoint;
  @override
  void dispose() {
    for (final c in [first, last, email, phone, address, city, password]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return _AuthScaffold(
      title: 'register'.tr(),
      child: Form(
        key: key,
        child: Column(
          children: [
            _field(first, 'firstName'),
            _field(last, 'lastName'),
            _field(
              email,
              'email',
              required: false,
              type: TextInputType.emailAddress,
            ),
            _field(
              phone,
              'phone',
              required: false,
              type: TextInputType.phone,
              validator: (_) {
                if (email.text.trim().isEmpty && phone.text.trim().isEmpty) {
                  return context.locale.languageCode == 'ar'
                      ? 'أدخل البريد الإلكتروني أو رقم الهاتف'
                      : 'Enter an email address or phone number';
                }
                return null;
              },
            ),
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: Theme.of(context).colorScheme.secondaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: Color(0xff16803c),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            context.locale.languageCode == 'ar'
                                ? 'موقع التوصيل'
                                : 'Delivery location',
                            style: const TextStyle(fontWeight: FontWeight.w900),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    LocationPickerButton(
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
                    if (address.text.isNotEmpty) ...[
                      const SizedBox(height: 9),
                      Text(
                        address.text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            _field(address, 'streetAddress'),
            _field(city, 'city'),
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TextFormField(
                controller: password,
                obscureText: passwordHidden,
                decoration: InputDecoration(
                  labelText: 'password'.tr(),
                  suffixIcon: IconButton(
                    onPressed: () =>
                        setState(() => passwordHidden = !passwordHidden),
                    icon: Icon(
                      passwordHidden
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                  ),
                ),
                validator: (v) =>
                    (v?.length ?? 0) < 6 ? 'passwordMin'.tr() : null,
              ),
            ),
            if (auth.error != null)
              Text(auth.error!.tr(), style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: auth.loading
                  ? null
                  : () async {
                      if (!key.currentState!.validate()) return;
                      final ok = await ref
                          .read(authProvider.notifier)
                          .register(
                            firstname: first.text,
                            lastname: last.text,
                            email: email.text,
                            phone: phone.text,
                            address: address.text,
                            city: city.text,
                            latitude: selectedPoint?.latitude,
                            longitude: selectedPoint?.longitude,
                            password: password.text,
                          );
                      if (ok && context.mounted) {
                        context.go(widget.redirect ?? '/account');
                      }
                    },
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              child: Text('register'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    bool required = true,
    bool password = false,
    TextInputType? type,
    String? Function(String?)? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: c,
      obscureText: password,
      keyboardType: type,
      decoration: InputDecoration(labelText: label.tr()),
      validator:
          validator ??
          (v) => required && (v?.trim().isEmpty ?? true)
              ? 'requiredField'.tr()
              : null,
    ),
  );
}

class _AuthScaffold extends StatelessWidget {
  const _AuthScaffold({required this.title, required this.child});
  final String title;
  final Widget child;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 20),
          const CircleAvatar(
            radius: 30,
            backgroundColor: Color(0xffe10613),
            child: Text(
              '7',
              style: TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 24),
          child,
        ],
      ),
    ),
  );
}
