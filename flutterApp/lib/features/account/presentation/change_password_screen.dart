import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  ConsumerState<ChangePasswordScreen> createState() => _PasswordState();
}

class _PasswordState extends ConsumerState<ChangePasswordScreen> {
  final key = GlobalKey<FormState>(),
      current = TextEditingController(),
      next = TextEditingController(),
      confirm = TextEditingController();
  bool busy = false;
  @override
  void dispose() {
    current.dispose();
    next.dispose();
    confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('changePassword'.tr())),
    body: Form(
      key: key,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _field(current, 'currentPassword'),
          _field(next, 'newPassword'),
          _field(confirm, 'confirmPassword', confirming: true),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: busy ? null : _save,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
            child: Text('saveChanges'.tr()),
          ),
        ],
      ),
    ),
  );
  Widget _field(TextEditingController c, String k, {bool confirming = false}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: c,
          obscureText: true,
          decoration: InputDecoration(labelText: k.tr()),
          validator: (v) {
            if ((v?.length ?? 0) < 6) return 'passwordMin'.tr();
            if (confirming && v != next.text) return 'passwordMismatch'.tr();
            return null;
          },
        ),
      );
  Future<void> _save() async {
    if (!key.currentState!.validate()) return;
    setState(() => busy = true);
    final ok = await ref
        .read(authProvider.notifier)
        .changePassword(current.text, next.text);
    if (!mounted) return;
    setState(() => busy = false);
    if (ok) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('passwordChanged'.tr())));
      context.pop();
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('passwordChangeError'.tr())));
    }
  }
}
