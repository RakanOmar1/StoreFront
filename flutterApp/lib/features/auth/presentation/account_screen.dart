import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/config/app_config.dart';
import '../../account/providers/theme_provider.dart';
import '../providers/auth_provider.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!auth.authenticated) {
      return Scaffold(
        appBar: AppBar(title: Text('account'.tr())),
        body: Center(
          child: FilledButton(
            onPressed: () => context.push('/auth/login'),
            child: Text('login'.tr()),
          ),
        ),
      );
    }
    final user = auth.user!;
    final theme = Theme.of(context);
    final initials =
        '${user.firstname.isNotEmpty ? user.firstname[0] : ''}${user.lastname.isNotEmpty ? user.lastname[0] : ''}'
            .toUpperCase();
    final avatar = user.avatarUrl == null
        ? null
        : '${AppConfig.apiBaseUrl}${user.avatarUrl}';
    return Scaffold(
      appBar: AppBar(title: Text('account'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.read(authProvider.notifier).refreshProfile(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundImage: avatar == null
                          ? null
                          : NetworkImage(avatar),
                      child: avatar == null
                          ? Text(
                              initials.isEmpty ? 'U' : initials,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.fullName,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(user.email ?? 'notProvided'.tr()),
                          if (user.phone?.isNotEmpty ?? false)
                            Text(user.phone!),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => context.push('/account/edit-profile'),
                      icon: const Icon(Icons.edit_outlined),
                    ),
                  ],
                ),
              ),
            ),
            _title('accountActivity'),
            Card(
              child: Column(
                children: [
                  _tile(
                    Icons.receipt_long_outlined,
                    'myOrders',
                    () => context.push('/account/orders'),
                  ),
                  _tile(
                    Icons.favorite_border,
                    'wishlist',
                    () => context.push('/account/wishlist'),
                  ),
                  _tile(
                    Icons.shopping_cart_outlined,
                    'cart',
                    () => context.go('/cart'),
                  ),
                ],
              ),
            ),
            _title('personalInformation'),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _info('fullName', user.fullName),
                    _info('email', user.email),
                    _info('phone', user.phone),
                    _info('streetAddress', user.address),
                    _info('city', user.city),
                  ],
                ),
              ),
            ),
            _title('preferences'),
            Card(
              child: Column(
                children: [
                  _tile(Icons.language, 'language', () => _language(context)),
                  _tile(
                    Icons.contrast,
                    'appearance',
                    () => _appearance(context, ref),
                  ),
                ],
              ),
            ),
            _title('security'),
            Card(
              child: _tile(
                Icons.lock_outline,
                'changePassword',
                () => context.push('/account/change-password'),
              ),
            ),
            const SizedBox(height: 18),
            OutlinedButton.icon(
              onPressed: () => _logout(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.error,
              ),
              icon: const Icon(Icons.logout),
              label: Text('logout'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _title(String key) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 22, 4, 8),
    child: Text(
      key.tr(),
      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
    ),
  );
  Widget _tile(IconData icon, String key, VoidCallback onTap) => ListTile(
    leading: Icon(icon),
    title: Text(key.tr()),
    trailing: const Icon(Icons.chevron_right),
    onTap: onTap,
  );
  Widget _info(String key, String? value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(key.tr(), style: const TextStyle(color: Colors.grey)),
        ),
        Expanded(
          child: Text(
            value?.trim().isNotEmpty == true ? value! : 'notProvided'.tr(),
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    ),
  );
  Future<void> _language(BuildContext context) => showModalBottomSheet(
    context: context,
    builder: (sheet) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: const Text('English'),
            onTap: () {
              context.setLocale(const Locale('en'));
              Navigator.pop(sheet);
            },
          ),
          ListTile(
            title: const Text('العربية'),
            onTap: () {
              context.setLocale(const Locale('ar'));
              Navigator.pop(sheet);
            },
          ),
        ],
      ),
    ),
  );
  Future<void> _appearance(
    BuildContext context,
    WidgetRef ref,
  ) => showModalBottomSheet(
    context: context,
    builder: (sheet) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: AppThemePreference.values
            .map(
              (value) => ListTile(
                title: Text(
                  ('theme${value.name[0].toUpperCase()}${value.name.substring(1)}')
                      .tr(),
                ),
                onTap: () {
                  ref.read(themeProvider.notifier).set(value);
                  Navigator.pop(sheet);
                },
              ),
            )
            .toList(),
      ),
    ),
  );
  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final confirmed =
        await showDialog<bool>(
          context: context,
          builder: (dialog) => AlertDialog(
            title: Text('logout'.tr()),
            content: Text('logoutConfirm'.tr()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialog, false),
                child: Text('cancel'.tr()),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(dialog, true),
                child: Text('logout'.tr()),
              ),
            ],
          ),
        ) ??
        false;
    if (confirmed) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) context.go('/home');
    }
  }
}
