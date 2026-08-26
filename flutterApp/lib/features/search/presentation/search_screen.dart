import 'dart:async';
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
    appBar: AppBar(title: const Text('Search')),
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
              hintText: 'Search products',
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
              const Text(
                'Recent searches',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
              ),
              if (recent.isNotEmpty)
                TextButton(
                  onPressed: () async {
                    final p = await SharedPreferences.getInstance();
                    await p.remove('recent_searches');
                    setState(() => recent = []);
                  },
                  child: const Text('Clear'),
                ),
            ],
          ),
          if (recent.isEmpty)
            const Expanded(
              child: Center(child: Text('Search for products by name')),
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
