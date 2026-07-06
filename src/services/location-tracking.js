import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { LocationService } = NativeModules;
const emitter = LocationService ? new NativeEventEmitter(LocationService) : null;

/**
 * Thin JS wrapper around the native LocationService foreground service (Android) that streams
 * the driver's location while they are Online. Replaces react-native-background-geolocation.
 *
 * On iOS there is no native service yet (Android APK is the only distributed target), so the
 * calls no-op and callers fall back to foreground @react-native-community/geolocation.
 */

// Ensure the permissions needed for foreground + background location tracking.
// Returns true when at least foreground location is granted (tracking works in foreground);
// background ("Allow all the time") is requested best-effort on Android 10+.
export async function ensureLocationPermissions() {
    if (Platform.OS !== 'android') {
        const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return status === RESULTS.GRANTED;
    }

    // 1. Foreground fine location — required for any tracking.
    const fine = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (fine !== RESULTS.GRANTED) {
        return false;
    }

    // 2. Notifications (Android 13+) so the ongoing foreground-service notification can show.
    if (Platform.Version >= 33) {
        await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    }

    // 3. Background location ("Allow all the time"), Android 10+. Best-effort: Android opens a
    //    separate settings screen and the user must pick it manually. Foreground tracking still
    //    works without it, so we do not fail if it is denied.
    if (Platform.Version >= 29) {
        const background = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        if (background !== RESULTS.GRANTED) {
            await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        }
    }

    return true;
}

export function startLocationService() {
    return LocationService?.start?.();
}

export function stopLocationService() {
    return LocationService?.stop?.();
}

export function addLocationListener(callback) {
    if (!emitter) {
        return { remove() {} };
    }

    return emitter.addListener('onLocationUpdate', callback);
}
