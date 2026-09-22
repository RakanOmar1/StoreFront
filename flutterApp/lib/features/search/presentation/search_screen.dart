import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchState();
}

class _SearchState extends State<SearchScreen> {
  final controller = TextEditingController();
  Timer? debounce;
  List<String> recent = [];
  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final p = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() => recent = p.getStringList('recent_searches') ?? []);
    }
  }

  void _changed(String value) {
    debounce?.cancel();
    debounce = Timer(const Duration(milliseconds: 400), () {
      if (value.trim().length >= 2) _submit(value);
    });
  }

  Future<void> _submit(String value) async {
    final q = value.trim();
    if (q.isEmpty) return;
    recent = [
      q,
      ...recent.where((x) => x.toLowerCase() != q.toLowerCase()),
    ].take(8).toList();
    final p = await SharedPreferences.getInstance();
    await p.setStringList('recent_searches', recent);
    if (mounted) {
      setState(() {});
      context.push('/search/results?q=${Uri.encodeQueryComponent(q)}');
    }
  }

  @override
  void dispose() {
    debounce?.cancel();
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('navSearch'.tr())),
    body: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            autofocus: true,
            onChanged: _changed,
            onSubmitted: _submit,
            decoration: InputDecoration(
              hintText: 'search'.tr(),
              prefixIcon: const Icon(Icons.search),
              suffixIcon: controller.text.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        controller.clear();
                        setState(() {});
                      },
                      icon: const Icon(Icons.clear),
                    ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _t(context, 'عمليات البحث الأخيرة', 'Recent searches'),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
              if (recent.isNotEmpty)
                TextButton(
                  onPressed: () async {
                    final p = await SharedPreferences.getInstance();
                    await p.remove('recent_searches');
                    setState(() => recent = []);
                  },
                  child: Text(_t(context, 'مسح', 'Clear')),
                ),
            ],
          ),
          if (recent.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  _t(
                    context,
                    'ابحث عن المنتجات بالاسم',
                    'Search for products by name',
                  ),
                ),
              ),
            ),
          Wrap(
            spacing: 8,
            children: recent
                .map(
                  (q) => ActionChip(
                    label: Text(q),
                    onPressed: () {
                      controller.text = q;
                      _submit(q);
                    },
                  ),
                )
                .toList(),
          ),
        ],
      ),
    ),
  );
}

String _t(BuildContext context, String ar, String en) =>
    context.locale.languageCode == 'ar' ? ar : en;
