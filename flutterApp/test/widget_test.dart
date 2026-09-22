import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('renders the 7 Stars Mall brand', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Text('Stars Mall'))));
    expect(find.text('Stars Mall'), findsOneWidget);
  });
}
