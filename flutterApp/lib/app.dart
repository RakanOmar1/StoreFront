import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/home/presentation/home_screen.dart';
import 'features/categories/presentation/categories_screen.dart';
import 'features/search/presentation/search_screen.dart';
import 'features/products/presentation/product_details_screen.dart';
import 'features/products/presentation/product_listing_screen.dart';
import 'shared/models/category.dart';
import 'shared/providers.dart';
import 'features/cart/presentation/cart_screen.dart';
import 'features/checkout/presentation/checkout_screen.dart';
import 'features/checkout/presentation/order_confirmation_screen.dart';
import 'features/checkout/models/checkout_models.dart';
import 'features/auth/presentation/auth_screens.dart';
import 'features/auth/presentation/account_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/account/providers/theme_provider.dart';
import 'features/account/presentation/edit_profile_screen.dart';
import 'features/account/presentation/change_password_screen.dart';
import 'features/wishlist/presentation/wishlist_screen.dart';
import 'features/orders/presentation/my_orders_screen.dart';
import 'features/operations/presentation/operations_screen.dart';

final _router = GoRouter(
  initialLocation: '/home',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (c, s, shell) => _Shell(shell: shell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/categories',
              builder: (_, _) => const CategoriesScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/search', builder: (_, _) => const SearchScreen()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/cart', builder: (_, _) => const CartScreen()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/account', builder: (_, _) => const AccountScreen()),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/categories/:id',
      builder: (_, state) => CategoryProductRoute(
        id: int.parse(state.pathParameters['id']!),
        initial: state.extra as Category?,
      ),
    ),
    GoRoute(
      path: '/search/results',
      builder: (context, state) {
        final query = state.uri.queryParameters['q'] ?? '';
        return ProductListingScreen(
          title: context.locale.languageCode == 'ar'
              ? 'نتائج البحث عن “$query”'
              : 'Results for “$query”',
          search: query,
        );
      },
    ),
    GoRoute(
      path: '/products/:id',
      builder: (_, state) =>
          ProductDetailsScreen(id: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/products',
      builder: (context, _) => ProductListingScreen(
        title: context.locale.languageCode == 'ar'
            ? 'كل المنتجات'
            : 'All products',
      ),
    ),
    GoRoute(path: '/checkout', builder: (_, _) => const CheckoutScreen()),
    GoRoute(
      path: '/auth/login',
      builder: (_, s) =>
          LoginScreen(redirect: s.uri.queryParameters['redirect']),
    ),
    GoRoute(
      path: '/auth/register',
      builder: (_, s) =>
          RegisterScreen(redirect: s.uri.queryParameters['redirect']),
    ),
    GoRoute(
      path: '/orders/:id/confirmation',
      builder: (_, s) =>
          OrderConfirmationScreen(response: s.extra as CheckoutResponse?),
    ),
    GoRoute(
      path: '/account/edit-profile',
      builder: (_, _) => const _AuthenticatedRoute(
        location: '/account/edit-profile',
        child: EditProfileScreen(),
      ),
    ),
    GoRoute(
      path: '/account/change-password',
      builder: (_, _) => const _AuthenticatedRoute(
        location: '/account/change-password',
        child: ChangePasswordScreen(),
      ),
    ),
    GoRoute(
      path: '/account/orders',
      builder: (_, _) => const _AuthenticatedRoute(
        location: '/account/orders',
        child: MyOrdersScreen(),
      ),
    ),
    GoRoute(
      path: '/account/wishlist',
      builder: (_, _) => const _AuthenticatedRoute(
        location: '/account/wishlist',
        child: WishlistScreen(),
      ),
    ),
    GoRoute(path: '/operations', builder: (_, _) => const OperationsScreen()),
  ],
);

class _AuthenticatedRoute extends ConsumerWidget {
  const _AuthenticatedRoute({required this.location, required this.child});

  final String location;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!auth.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          context.go(
            '/auth/login?redirect=${Uri.encodeQueryComponent(location)}',
          );
        }
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return child;
  }
}

class SevenStarsApp extends ConsumerWidget {
  const SevenStarsApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
    debugShowCheckedModeBanner: false,
    title: '7 Stars Mall',
    theme: buildTheme(arabic: context.locale.languageCode == 'ar'),
    darkTheme: buildDarkTheme(arabic: context.locale.languageCode == 'ar'),
    themeMode: switch (ref.watch(themeProvider)) {
      AppThemePreference.light => ThemeMode.light,
      AppThemePreference.dark => ThemeMode.dark,
      _ => ThemeMode.system,
    },
    locale: context.locale,
    supportedLocales: context.supportedLocales,
    localizationsDelegates: context.localizationDelegates,
    routerConfig: _router,
  );
}

class _Shell extends ConsumerWidget {
  const _Shell({required this.shell});
  final StatefulNavigationShell shell;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(cartProvider).totalQuantity;
    return Scaffold(
      body: SafeArea(top: false, child: shell),
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (i) =>
            shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: [
          for (final x in const [
            (Icons.home_outlined, 'home'),
            (Icons.grid_view_rounded, 'categories'),
            (Icons.search, 'navSearch'),
            (Icons.shopping_cart_outlined, 'cart'),
            (Icons.person_outline, 'account'),
          ])
            NavigationDestination(
              icon: x.$2 == 'cart' && count > 0
                  ? Badge(label: Text('$count'), child: Icon(x.$1))
                  : Icon(x.$1),
              label: x.$2.tr(),
            ),
        ],
      ),
    );
  }
}
