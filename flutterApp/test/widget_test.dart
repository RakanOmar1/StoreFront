import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seven_stars_mall/app.dart';
import 'package:seven_stars_mall/shared/providers.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('renders the 7 Stars Mall shell', (tester) async {
    await EasyLocalization.ensureInitialized();
    await tester.pumpWidget(
      EasyLocalization(
        supportedLocales: const [Locale('en'), Locale('ar')],
        path: 'assets/translations',
        fallbackLocale: const Locale('en'),
        child: ProviderScope(
          overrides: [
            productsProvider.overrideWith((_) async => []),
            categoriesProvider.overrideWith((_) async => []),
            animationsEnabledProvider.overrideWithValue(false),
          ],
          child: const SevenStarsApp(),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('Stars Mall'), findsOneWidget);
  });
}
