package io.fleetbase.navigator.location

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * JS-facing bridge for the location foreground service. Exposes start()/stop() and the
 * addListener/removeListeners stubs required by NativeEventEmitter. Location fixes are not
 * returned here — they are streamed through the "onLocationUpdate" device event emitted by
 * LocationTrackingService.
 */
class LocationServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LocationService"

    @ReactMethod
    fun start(promise: Promise) {
        try {
            val intent =
                Intent(reactContext, LocationTrackingService::class.java).apply {
                    action = LocationTrackingService.ACTION_START
                }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("start_failed", e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            val intent =
                Intent(reactContext, LocationTrackingService::class.java).apply {
                    action = LocationTrackingService.ACTION_STOP
                }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("stop_failed", e)
        }
    }

    // Required so NativeEventEmitter does not warn on iOS/Android.
    @ReactMethod fun addListener(eventName: String) {}

    @ReactMethod fun removeListeners(count: Int) {}
}
