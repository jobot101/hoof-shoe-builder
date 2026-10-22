# Hoof Shoe Builder

Ragamuffin Studios phone app: photograph a trimmed hoof sole with the 100 mm reference card, trace the wall and frog, and export a fitted 3D-printable shoe STL built on the house template. Android and iPhone from one Capacitor project.

## Install

- **Web app (any phone):** open https://graphicsstorytelling-arch.github.io/hoof-shoe-builder/ in Safari or Chrome, then Share › Add to Home Screen. Works offline after the first visit; saved STLs go to Files › Downloads.
- **Android:** open the latest release on the phone, tap `HoofShoe.apk`, allow installs from the browser. New builds install over the old one.
- **iPhone:** TestFlight, once the Apple secrets listed in `.github/workflows/ios.yml` are set.

## Change the tool

The tool lives in `src/tool.html` (same page as the web version) and `src/shoe-geom.js`. Push to `main` and both workflows rebuild. `npm run build` assembles `www/`; `npx cap sync` copies it into the native projects.

## Signing

The release key is not in this repo. Add repo secrets `HOOF_KEYSTORE_B64` (base64 of the keystore) and `HOOF_KS_PASS` and the Android workflow signs every APK with it, so updates install in place. Without them it builds a debug APK.
