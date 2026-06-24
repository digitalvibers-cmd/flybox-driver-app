# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**flybox-driver-app** is a React Native mobile app for **FlyBox Delivery** drivers — forked from upstream [`fleetbase/navigator-app`](https://github.com/fleetbase/navigator-app). It connects to the **FleetVibe** backend (an internal Fleetbase deployment at `apifleetvibe.digitalvibe.rs` for dev, `api.flybox.rs` for prod).

**License**: AGPL-3.0 (inherited from upstream).

**Relationship with `fleet-vibe` monorepo**: this is a **separate repository**, NOT a subdir, because:
- React Native toolchain (Gradle, Android Studio, Metro) is incompatible with the Docker stack in `fleet-vibe`.
- Mobile distribution (APK/AAB → Play Store / Firebase) has nothing to do with the Docker-based deploy of API/console/portal.
- A real fork keeps the upstream link clean (`git fetch upstream && git merge upstream/main`).

For backend/API context (Fleetbase models, dev/prod env, API key generation), see `/Users/buco/Desktop/Antygravity apps/Fleet Vibe/CLAUDE.md`.

## Repository Structure

| Item | Value |
|------|-------|
| Repo URL | `https://github.com/digitalvibers-cmd/flybox-driver-app` |
| Upstream | `https://github.com/fleetbase/navigator-app` |
| Local path | `~/Projects/flybox-driver-app` (NOT `~/Desktop/...` — see "Known issues") |
| Default branch | `main` (mirrors upstream after `git merge upstream/main`) |
| Custom work branch | `flybox/main` (planned — FlyBox-specific patches and branding) |

### Upstream sync workflow

```bash
git fetch upstream
git checkout main && git merge upstream/main && git push       # update fork's main
git checkout flybox/main && git merge main                      # bring upstream into our brand
```

## Tech Stack

- **React Native** 0.77.0-rc.6 (bare workflow, no Expo)
- **Hermes** JS engine (`hermesEnabled=true` in `android/gradle.properties`)
- **New Architecture DISABLED** (`newArchEnabled=false`) — required because some pinned deps don't yet support it cleanly
- **TypeScript** + Tamagui UI
- **Yarn Berry** 4.16.0 (managed via `corepack`, NOT yarn classic — see below)
- **JDK** 17 (Homebrew `openjdk@17`, keg-only)
- **Android SDK** Platform 35, Build-Tools 35.0.0, NDK 27.1.12297006
- **Kotlin** 2.0.21, **Gradle** 8.10.2, **AGP** 8.7.2
- **Node** 20 (corepack auto-selected via `packageManager` field; Node 24 also works for runtime but corepack uses whatever yarn was activated for)

Key dependencies (versions pinned via Yarn Berry from upstream `v2.0.9` tag — DO NOT use `yarn classic` which pulls newer breaking versions):
- `react-native-reanimated` 3.16.7 (NOT 3.19.x — that requires RN 0.78+)
- `react-native-screens` 4.6.0 (NOT 4.25.x — that requires RN 0.82+)
- `react-native-vision-camera` 4.6.4 (QR scanner)
- `react-native-config` 1.5.3 (loads `.env` at build time → BuildConfig.java)

## Common Commands

All commands assume `cwd = ~/Projects/flybox-driver-app` unless noted.

### Build & Run

```bash
yarn install                          # corepack picks Yarn 4.16.0 automatically
cd android && ./gradlew installDebug  # build + install APK on connected device/emulator
yarn start                            # Metro bundler on :8081
```

### Emulator

```bash
emulator -list-avds                                       # → FlyBox_Pixel6_API35
emulator -avd FlyBox_Pixel6_API35 -no-snapshot-save &     # boot
adb wait-for-device
adb reverse tcp:8081 tcp:8081                             # so app finds Metro at 10.0.2.2:8081
adb emu geo fix 20.4489 44.7866                           # SET LOCATION TO BELGRADE (lng, lat — note order!)
adb shell am start -n io.fleetbase.navigator/.MainActivity
```

### Useful adb

```bash
adb logcat -d -t 500 | grep ReactNativeJS                 # tail RN logs
adb shell input text "63525132X"                          # type into focused field (if hw.keyboard=no)
adb shell screencap -p /sdcard/s.png && adb pull /sdcard/s.png  # screenshot
adb shell pm list packages | grep navigator               # is app installed
adb shell am force-stop io.fleetbase.navigator            # kill app
```

## Local Development Setup (one-time)

1. **JDK 17** (no-sudo install via Homebrew formula, not cask):
   ```bash
   brew install openjdk@17
   ```
2. **Android Studio** (just for SDK Manager UI, optional after CLI install):
   ```bash
   brew install --cask android-studio
   ```
3. **Android SDK components** (CLI path, no GUI required):
   ```bash
   brew install --cask android-commandlinetools
   sdkmanager --sdk_root=$HOME/Library/Android/sdk \
     "platform-tools" "platforms;android-35" "build-tools;35.0.0" \
     "emulator" "ndk;27.1.12297006" \
     "system-images;android-35;google_apis;arm64-v8a" \
     "cmdline-tools;latest"
   yes | sdkmanager --sdk_root=$HOME/Library/Android/sdk --licenses
   ```
4. **AVD** (Pixel 6, API 35, arm64-v8a for Apple Silicon hardware accel):
   ```bash
   avdmanager create avd -n FlyBox_Pixel6_API35 \
     -k "system-images;android-35;google_apis;arm64-v8a" \
     -d pixel_6
   # Patch config so macOS keyboard works in emulator:
   sed -i '' 's/^hw\.keyboard=no/hw.keyboard=yes/' ~/.android/avd/FlyBox_Pixel6_API35.avd/config.ini
   ```
5. **Shell env** in `~/.zshrc`:
   ```bash
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
   export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
   ```
6. **Corepack** (enables yarn berry):
   ```bash
   corepack enable
   ```

## `.env` Configuration

`.env` is gitignored; values are baked into the APK at build time by `react-native-config` (BuildConfig.java).

| Key | Dev value | Notes |
|-----|-----------|-------|
| `APP_NAME` | `Navigator` | Will become `FlyBox Driver` during branding phase |
| `APP_IDENTIFIER` | `io.fleetbase.navigator` | Will become `rs.flybox.driver` during branding phase |
| `APP_LINK_PREFIX` | `flbnavigator` | Will become `flybox` during branding phase |
| `FLEETBASE_HOST` | `https://apifleetvibe.digitalvibe.rs` | FleetVibe dev API |
| `FLEETBASE_KEY` | `flb_live_YBEmTW8vUajMinvzosGH` | Public API key from FleetVibe dev console (Settings → Developers → API Keys). NEW key per environment; rotate as needed. |
| `GOOGLE_MAPS_API_KEY` | (same as `fleet-vibe/.env`) | Reused from web stack |
| `DEFAULT_COORDINATES` | `44.7866,20.4489` | Belgrade |

### Switching API endpoint without rebuild — InstanceLink screen

The app has `src/screens/InstanceLinkScreen.tsx` for **runtime override** of `FLEETBASE_HOST` + `FLEETBASE_KEY` (stored in app `useStorage` as `INSTANCE_LINK_FLEETBASE_*`). Used when testing against local backend without rebuilding the APK. For local dev backend (Docker stack at `localhost:8000`):

| Field | Value |
|-------|-------|
| Fleetbase Host | `http://10.0.2.2:8000` (emulator → host bridge IP) |
| Fleetbase Key | (local FleetVibe console API key) |
| SocketCluster Host | `10.0.2.2` |
| SocketCluster Port | `38000` |
| SocketCluster Secure | OFF |

Cleartext HTTP for `10.0.2.2` requires `android:networkSecurityConfig` with `cleartextTrafficPermitted="true"` for that domain in `android/app/src/main/AndroidManifest.xml` — not yet configured. Add when needed.

## Critical Patches and Workarounds

These changes live in `node_modules/` (wiped by every `yarn install`) and **must be re-applied** until persisted as Yarn Berry patches in `.yarn/patches/` or via `patch-package`.

### 1. `node_modules/react-native/cli.js` — `process.exit(0)` after `cli.run()`

**Symptom**: Gradle `autolinkLibrariesFromCommand` (settings.gradle line 3) calls `npx @react-native-community/cli config` and times out after 5 min because the CLI doesn't `process.exit(0)` when the promise resolves — some pending handle keeps Node alive.

**Patch**: edit `node_modules/react-native/cli.js`, find the line near 220:

```js
return require('@react-native-community/cli').run(name);
```

Change to (CONDITIONAL — only exits for `config` command, leaves `start`/`bundle`/`run-android` alone):

```js
const _runPromise = require('@react-native-community/cli').run(name);
return process.argv.includes('config') ? _runPromise.then(() => process.exit(0)) : _runPromise;
```

**Why conditional**: an unconditional `.then(() => process.exit(0))` breaks:
- `yarn start` — Metro server promise resolves on listen, then process.exit kills it
- `assembleRelease` — `react-native bundle` writes the JS bundle asynchronously after the promise resolves; process.exit truncates the file write so Hermes can't open it (exit code 5)

The conditional version fixes both while keeping the Gradle autolink working.

**Persistent fix TODO**: use `yarn patch react-native` to generate a Yarn Berry patch in `.yarn/patches/` and add it to `resolutions` in `package.json`. Currently lives only in `node_modules/` and is wiped by every `yarn install`.

### 2. `node_modules/react-native-i18n/android/build.gradle` — `compile` → `implementation`

`react-native-i18n@2.0.15` (last updated 2018) uses Gradle 6 `compile` keyword which was removed in Gradle 7+. Patch is auto-applied by Yarn Berry from `.yarn/patches/react-native-i18n-npm-2.0.15-7f3cf7cee6.patch` IF you run `yarn install` with yarn berry (NOT classic). The single meaningful change:

```diff
-  compile "com.facebook.react:react-native:+"
+  implementation "com.facebook.react:react-native:+"
```

### 3. `node_modules/react-native-notifications/lib/android/app/build.gradle` — remove `dexOptions`

`react-native-notifications@5.1.0` has a `dexOptions { javaMaxHeapSize "4g" }` block that AGP 7+ removed. Yarn Berry patch in `.yarn/patches/react-native-notifications-npm-5.1.0-...patch` removes it. Also touches `FcmToken.java` to use the new `AppLifecycleFacadeHolder` API instead of the deprecated `ReactInstanceManager`.

### 4. `android/app/google-services.json` — placeholder

Real Firebase project not yet set up. We have a placeholder JSON with `package_name=io.fleetbase.navigator` and dummy IDs so the Google Services plugin doesn't fail. **Push notifications won't work** until replaced with a real Firebase config.

### 5. `android/app/src/main/res/values/strings.xml` — placeholder string resources

The manifest references `@string/TRANSISTORSOFT_LICENSE_KEY`, `@string/FACEBOOK_APP_ID`, `@string/FACEBOOK_CLIENT_TOKEN`, `@string/GOOGLE_MAPS_API_KEY`. These are placeholder strings in `strings.xml` to satisfy resource linking. Real values needed for:
- Background geolocation (Transistorsoft) — paid license required
- Facebook login — not used in our flow, but Manifest references it
- Google Maps API key — `react-native-config` reads `.env`'s `GOOGLE_MAPS_API_KEY` but the manifest meta-data still references the string resource directly; either inject at build time via Gradle `manifestPlaceholders` or paste real key into strings.xml

### 6. Yarn Berry, NOT classic

The project's `yarn.lock` was originally yarn berry format (from upstream v2.0.9 tag). At some point, upstream regenerated it with yarn classic, pinning `react-native-screens@4.25.2` + `react-native-reanimated@3.19.5` — versions that require RN 0.78+/0.82+ and don't compile against RN 0.77.

**Always use yarn berry**: ensure `corepack enable` ran once, `packageManager: yarn@4.16.0` in `package.json`, and `.yarn/releases/yarn-4.16.0.cjs` exists. If you accidentally run yarn classic, restore yarn.lock from the v2.0.9 tag:
```bash
git checkout v2.0.9 -- yarn.lock && rm -rf node_modules && yarn install
```

## Known Issues & Workarounds

### macOS sandbox blocks Node fs operations when `cwd` is inside `~/Desktop/`

**Symptom**: `node` operations (`require`, `fs.readFileSync`, etc.) hang indefinitely or throw `ECANCELED` (errno -89) when the working directory is anywhere under `~/Desktop/`. macOS Tahoe (26.x) sandboxes Documents/Desktop more aggressively.

**Fix**: Project lives at `~/Projects/flybox-driver-app/`, NOT `~/Desktop/`. Don't move it back.

If you DO need to do anything from a Desktop-based path, run the command with `cwd = /tmp`:
```bash
cd /tmp && node /Users/buco/Desktop/.../some-script.js
```

### `ELECTRON_RUN_AS_NODE` env from Antigravity IDE breaks Node

**Symptom**: Same as above (`require` hangs), but happens even from `~/Projects/`. Caused by `ELECTRON_RUN_AS_NODE=1` + `VSCODE_*` env variables inherited from Antigravity IDE's terminal.

**Fix**: Run Node-based commands in a clean shell:
```bash
env -i HOME="$HOME" PATH="/opt/homebrew/bin:/usr/local/bin:/bin:/usr/bin" \
  zsh -c 'cd ~/Projects/flybox-driver-app && yarn install'
```

The Gradle build doesn't have this problem because it runs Java, not Node directly.

### `MapViewDirections Error: ZERO_RESULTS`

**Symptom**: When viewing an order in the app, logcat is flooded with `MapViewDirections Error: Error on GMAPS route request: ZERO_RESULTS`.

**Cause**: Driver's emulator GPS location is too far from order pickup/dropoff (default emulator location = Mountain View, CA; order in Belgrade = 11000+ km — Google Maps Directions API refuses).

**Fix**: Set emulator location to Belgrade before testing:
```bash
adb emu geo fix 20.4489 44.7866   # lng FIRST, then lat
```
Then toggle the Tracking switch in the app to pick up the new location.

For pickup/dropoff points to render correctly, those orders in the FleetVibe console must have **real geocoded addresses**, not `(0, 0)`. The Fleet Vibe backend has patches to prevent `(0, 0)` from being stored on new orders (`Place.php`), but legacy orders may still have bad coordinates.

### "Active Orders: 0" but Orders tab badge shows N

Normal — different counts:
- **Active Orders** = currently dispatched / in-progress
- **Orders tab badge** = all orders assigned to driver (any status)

### Watchman permission errors on Desktop path

`watchman: Operation not permitted` when project is under `~/Desktop/` (macOS TCC). Mitigations:
- Move project to `~/Projects/` (current solution)
- OR `watchman shutdown-server` + set `META_NO_WATCHMAN=1` (Metro falls back to node crawler)

## Emulator / AVD Specifics

- **Name**: `FlyBox_Pixel6_API35`
- **Device**: Pixel 6
- **API**: 35 (Android 15 "VanillaIceCream")
- **ABI**: `arm64-v8a` (uses Apple Silicon Hypervisor.framework for hardware acceleration)
- **Tag**: `google_apis` (NOT `google_apis_playstore` — fine for development; no Play Store account)
- **`hw.keyboard=yes`** in `config.ini` (macOS keyboard works in emulator; without this only soft keyboard)
- **Path**: `~/.android/avd/FlyBox_Pixel6_API35.avd/`

## Backend Dependencies (FleetVibe)

For full end-to-end testing the FleetVibe stack must have:

1. **API key** (Settings → Developers → API Keys → Create). Plaintext value is shown ONCE at creation; copy to `.env`. Stored in `api_credentials.key` column.
2. **Driver user** with phone number (for SMS login). Phone format: `+381612345678` (E.164).
3. **SMS provider** configured for FleetVibe to send verification codes. Not yet verified to be working end-to-end on dev — Buco's first login worked manually.
4. **At least one Order** assigned to the test driver, with real geocoded pickup/dropoff addresses.

To fetch a key directly from the dev DB (when needed):
```bash
ssh root@46.225.99.48
docker exec fleetvibe-database-1 mysql -uroot -p<DEV_DB_PASSWORD> fleetbase \
  -e "SELECT id, name, \`key\`, test_mode, created_at FROM api_credentials WHERE deleted_at IS NULL;"
```

## Smoke Test Sequence (verify everything works)

```bash
# 1. Start emulator
emulator -avd FlyBox_Pixel6_API35 -no-snapshot-save &
adb wait-for-device

# 2. Set location to Belgrade
adb emu geo fix 20.4489 44.7866

# 3. Build & install APK (Metro NOT required for install)
cd ~/Projects/flybox-driver-app/android
./gradlew installDebug

# 4. Start Metro (in separate terminal)
cd ~/Projects/flybox-driver-app
yarn start

# 5. Wire emulator to Metro
adb reverse tcp:8081 tcp:8081

# 6. Launch app
adb shell am start -n io.fleetbase.navigator/.MainActivity

# 7. Verify
adb logcat -d -t 200 | grep ReactNativeJS    # expect "Socket connected."
```

Expected: SMS login screen with country `+381` selector → enter phone (without country code) → SMS code → driver dashboard.

## Future Work

Tracked in `/Users/buco/.claude/plans/zelim-da-analiziras-i-glistening-pearl.md` (the original plan file). Highlights:

1. **FlyBox branding** — ✅ DONE (cosmetic): app display name is now **"FlyBox Driver"** (`android strings.xml app_name`, `ios Info.plist CFBundleDisplayName`, `app.json displayName`, `.env APP_NAME`); launcher icons (Android `mipmap-*/ic_launcher*.png`, iOS `AppIcon.appiconset`), in-app logo (`assets/navigator-icon-transparent.png`), and splash (`assets/splash-screen.png` → regenerated bootsplash) all use the Flybox 512×512 mark (sourced from `Fleet Vibe/customer-portal/public/icons/icon-512x512.png`, staged as `assets/flybox-icon-512.png`).
   - In-app header title: two hardcoded `Navigator` literals in `src/navigation/DriverNavigator.tsx` (the bottom-tab header `headerLeft` ~line 514, and `getDriverNavigatorHeaderOptions` ~line 183) were changed to `FlyBox Driver`. These are NOT driven by `config('APP_NAME')`.
   - **Intentionally deferred**: package-id rename `io.fleetbase.navigator` → `rs.flybox.driver` and URL scheme `flbnavigator` → `flybox`. Left unchanged so the FleetVibe backend "link app" deep-link, Firebase `google-services.json`, and installed builds keep working. Doing this rename later requires updating those in lockstep.
   - **iOS follow-up**: the 1024 `ios-marketing` AppIcon currently has an alpha channel (App Store rejects alpha) and is upscaled from 512 — supply a 1024 opaque master before any App Store submission (iOS build is deferred anyway).
   - **Play Store feature banner** (`assets/play-store-feature-image.png`, 1024×500) still has Navigator artwork — needs a designed FlyBox banner.
   - **Bootsplash gotcha**: `yarn generate:launch-screen` writes the Android logo to `res/drawable-*/bootsplash_logo.png`, but the project's `res/values/styles.xml` `BootTheme` originally pointed `bootSplashLogo` at `@mipmap/bootsplash_logo` (stale paper-plane copies that the generator does NOT touch). Fixed by pointing it at `@drawable/bootsplash_logo` and deleting the orphaned `mipmap-*/bootsplash_logo.png`. If you re-run the generator, keep the theme on `@drawable`.
2. **QR self-assign feature** — new `src/screens/PackageScanScreen.tsx` that reuses the existing `QrCodeScanner` component. Backend endpoint `POST /int/v1/fleetvibe/orders/scan-assign` in a custom FleetVibe Laravel package (not yet built).
3. **Persist `cli.js` patch** as a yarn berry patch in `.yarn/patches/` + `resolutions` entry.
4. **Real Firebase project** — replace placeholder `google-services.json`. Required for push notifications.
5. **Real string resources** for Transistorsoft license + Facebook IDs (or strip Facebook out if unused).
6. **CI/CD** — GitHub Actions runner with Android SDK, build APK on push, optionally Firebase App Distribution for beta APK delivery.
7. **Localization** — Navigator uses `react-native-i18n`; add `sr.json` (Serbian).
8. **iOS** — currently deferred; will require Xcode + CocoaPods + Apple Developer account.

## References

- Plan & decision log: `/Users/buco/.claude/plans/zelim-da-analiziras-i-glistening-pearl.md`
- Backend monorepo: `/Users/buco/Desktop/Antygravity apps/Fleet Vibe/CLAUDE.md`
- Upstream repo: https://github.com/fleetbase/navigator-app
- FleetVibe dev console: https://fleetvibe.digitalvibe.rs
- FleetVibe dev API: https://apifleetvibe.digitalvibe.rs
- Hetzner server (where FleetVibe lives): `46.225.99.48` (root SSH via `~/.ssh/id_ed25519`)
