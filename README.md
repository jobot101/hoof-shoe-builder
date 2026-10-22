# Shoe Builder

Ragamuffin Studios tool: photograph a trimmed hoof sole with the 100 mm reference card, trace the wall and frog, pick the logo, and save a fitted 3D-printable shoe STL built on the house template.

Built with **React 19 + Vite** (plain `.js` / `.jsx`). One codebase, three targets:

| Target | Build | Output |
|---|---|---|
| Web app (GitHub Pages, any phone) | `npm run build` | `www/` |
| Android + iPhone apps (Capacitor) | `npm run build && npx cap sync` | `android/`, `ios/` |
| Claude artifact (single HTML file) | `npm run build:artifact` | `artifact/shoe-builder.html` |

`npm run dev` runs it locally with hot reload.

## Install

- **Web app:** open https://jobot101.github.io/hoof-shoe-builder/ in Safari or Chrome, then Share › Add to Home Screen. Works offline after the first visit; saved STLs go to Files › Downloads.
- **Android:** open the latest release on the phone and tap `ShoeBuilder.apk`.
- **iPhone app:** TestFlight, once the Apple secrets listed in `.github/workflows/ios.yml` are set.

## Code map

- `src/App.jsx` – the screen: trace steps, logo picker, save
- `src/components/TraceBoard.jsx` – photo canvas: tap to place, drag points, pinch to zoom
- `src/components/Preview3D.jsx` – three.js brass preview
- `src/lib/shoeGeom.js` – geometry: outline → plate, rim, frog V, holes, toe cuts, logo → STL
- `src/lib/template.js` – the fixed house template sizes and logo choices
- `src/lib/platform.js` – camera, saving and sharing on app / web / Claude

Push to `main` and the web app and Android APK rebuild automatically.

## Signing

The Android release key is not in this repo. Add repo secrets `HOOF_KEYSTORE_B64` (base64 of the keystore) and `HOOF_KS_PASS` and every APK is signed with it, so updates install in place. Without them it builds a debug APK.
