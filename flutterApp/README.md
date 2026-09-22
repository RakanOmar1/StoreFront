# Stars Mall Flutter App

The mobile and web client for the Stars Mall grocery storefront, customer
checkout and orders, delivery operations, and store administration.

Release builds connect by default to the hosted Stars Mall API:

`https://mall7stars-d3c123d08509.herokuapp.com`

Build the production Android APK with:

```powershell
flutter build apk --release
```

For local development, the API base URL can be overridden at run or build
time:

```powershell
flutter run --dart-define=API_BASE_URL=http://YOUR_LOCAL_BACKEND_HOST:3000
flutter build apk --release --dart-define=API_BASE_URL=http://YOUR_LOCAL_BACKEND_HOST:3000
```

Debug Android emulator builds default to `http://10.0.2.2:3000`; debug Flutter
web builds default to `http://localhost:3000`.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
