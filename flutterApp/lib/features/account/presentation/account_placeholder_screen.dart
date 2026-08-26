import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class AccountPlaceholderScreen extends StatelessWidget {
  const AccountPlaceholderScreen({super.key, required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title.tr())),
    body: Center(child: Text('comingSoon'.tr())),
  );
}
