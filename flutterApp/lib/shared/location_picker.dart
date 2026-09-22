import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

class SelectedLocation {
  const SelectedLocation({
    required this.point,
    required this.address,
    required this.city,
  });

  final LatLng point;
  final String address;
  final String city;
}

class LocationPickerButton extends StatelessWidget {
  const LocationPickerButton({
    super.key,
    required this.onSelected,
    this.initialPoint,
    this.compact = false,
  });

  final ValueChanged<SelectedLocation> onSelected;
  final LatLng? initialPoint;
  final bool compact;

  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
    onPressed: () async {
      final result = await showDialog<SelectedLocation>(
        context: context,
        barrierDismissible: false,
        builder: (_) => LocationPickerDialog(initialPoint: initialPoint),
      );
      if (result != null) onSelected(result);
    },
    icon: const Icon(Icons.map_outlined),
    label: Text(_localized(context, 'فتح الخريطة', 'Open map')),
    style: OutlinedButton.styleFrom(
      minimumSize: Size(compact ? 0 : double.infinity, 48),
      padding: const EdgeInsets.symmetric(horizontal: 14),
    ),
  );
}

class LocationPickerDialog extends StatefulWidget {
  const LocationPickerDialog({super.key, this.initialPoint});
  final LatLng? initialPoint;

  @override
  State<LocationPickerDialog> createState() => _LocationPickerDialogState();
}

class _LocationPickerDialogState extends State<LocationPickerDialog> {
  static const _fallback = LatLng(31.9038, 35.2034);
  final controller = MapController();
  final dio = Dio();
  late LatLng selected = widget.initialPoint ?? _fallback;
  SelectedLocation? resolved;
  bool loading = false;
  String? error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _resolve(selected);
    });
  }

  Future<void> _currentLocation() async {
    final deniedMessage = _localized(
      context,
      'تم رفض إذن الموقع. يمكنك تحديده يدوياً.',
      'Location permission was denied. You can select it manually.',
    );
    setState(() {
      loading = true;
      error = null;
    });
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception(deniedMessage);
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      final point = LatLng(position.latitude, position.longitude);
      controller.move(point, 17);
      await _resolve(point);
    } catch (e) {
      if (mounted) {
        setState(() {
          error = e.toString().replaceFirst('Exception: ', '');
          loading = false;
        });
      }
    }
  }

  Future<void> _resolve(LatLng point) async {
    setState(() {
      selected = point;
      loading = true;
      error = null;
    });
    try {
      final locale = context.locale.languageCode;
      final response = await dio.get<Map<String, dynamic>>(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'format': 'jsonv2',
          'lat': point.latitude,
          'lon': point.longitude,
          'addressdetails': 1,
          'accept-language': locale,
        },
        options: Options(headers: {'User-Agent': 'SevenStarsMall/1.0'}),
      );
      final data = response.data ?? const <String, dynamic>{};
      final address = Map<String, dynamic>.from(
        data['address'] as Map? ?? const {},
      );
      final city =
          ['city', 'town', 'village', 'municipality', 'county', 'state']
              .map((key) => address[key]?.toString().trim() ?? '')
              .firstWhere((value) => value.isNotEmpty, orElse: () => '');
      if (!mounted) return;
      setState(() {
        resolved = SelectedLocation(
          point: point,
          address: data['display_name']?.toString() ?? '',
          city: city,
        );
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          error = _localized(
            context,
            'تم حفظ النقطة، لكن تعذر جلب العنوان. استخدم الموقع ثم اكتب العنوان والمدينة يدوياً.',
            'The point is saved, but its address could not be retrieved. Use this location, then enter the address and city manually.',
          );
          resolved = SelectedLocation(point: point, address: '', city: '');
        });
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final content = Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 14, 10, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _localized(context, 'حدد موقعك', 'Choose your location'),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _localized(
                        context,
                        'انقر على الخريطة أو استخدم موقعك الحالي لتحديد نقطة التوصيل بدقة.',
                        'Tap the map or use your current location to select the exact delivery point.',
                      ),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
        ),
        Expanded(
          child: Stack(
            children: [
              FlutterMap(
                mapController: controller,
                options: MapOptions(
                  initialCenter: selected,
                  initialZoom: 16,
                  onTap: (_, point) => _resolve(point),
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.starsmall.storefront',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: selected,
                        width: 52,
                        height: 52,
                        child: const Icon(
                          Icons.location_pin,
                          color: Color(0xffe10613),
                          size: 48,
                        ),
                      ),
                    ],
                  ),
                  RichAttributionWidget(
                    attributions: [
                      TextSourceAttribution('OpenStreetMap contributors'),
                    ],
                  ),
                ],
              ),
              PositionedDirectional(
                top: 12,
                start: 12,
                child: FloatingActionButton.small(
                  heroTag: null,
                  tooltip: _localized(
                    context,
                    'استخدام الموقع الحالي',
                    'Use current location',
                  ),
                  onPressed: loading ? null : _currentLocation,
                  child: const Icon(Icons.my_location),
                ),
              ),
              if (loading)
                const Positioned.fill(
                  child: IgnorePointer(
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
            ],
          ),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: Color(0xffe2e8e5))),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _localized(context, 'الموقع المحدد', 'Selected location'),
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                error ??
                    (resolved?.address.isNotEmpty == true
                        ? resolved!.address
                        : _coordinateLabel(selected)),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: resolved == null || loading
                    ? null
                    : () => Navigator.pop(context, resolved),
                icon: const Icon(Icons.check_circle_outline),
                label: Text(
                  _localized(
                    context,
                    'استخدام هذا الموقع',
                    'Use this location',
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );

    if (size.width < 700) {
      return Dialog.fullscreen(child: SafeArea(child: content));
    }
    return Dialog(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: SizedBox(
        width: 900,
        height: size.height.clamp(560, 760),
        child: content,
      ),
    );
  }
}

String _localized(BuildContext context, String arabic, String english) =>
    context.locale.languageCode == 'ar' ? arabic : english;

String _coordinateLabel(LatLng point) =>
    '${point.latitude.toStringAsFixed(6)}, ${point.longitude.toStringAsFixed(6)}';
