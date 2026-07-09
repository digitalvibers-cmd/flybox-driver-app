package io.fleetbase.navigator.location

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import io.fleetbase.navigator.R

/**
 * Foreground service that streams the driver's location to JS while they are Online.
 *
 * Replaces the paid react-native-background-geolocation (Transistorsoft) plugin. Runs a
 * FOREGROUND_SERVICE_TYPE_LOCATION service with an ongoing notification so Android keeps the
 * app process alive and delivers location updates even when the app is backgrounded, the
 * screen is off, or the driver has switched to a navigation app.
 *
 * Location fixes are emitted to JS via the "onLocationUpdate" device event; the JS layer
 * (LocationContext) forwards them to the Fleetbase API through driver.track().
 */
class LocationTrackingService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private val locationCallback =
        object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { emitLocation(it) }
            }
        }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopTracking()
            return START_NOT_STICKY
        }

        startForegroundWithNotification()
        startTracking()
        return START_STICKY
    }

    private fun startForegroundWithNotification() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun startTracking() {
        val request =
            LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, UPDATE_INTERVAL_MS)
                .setMinUpdateIntervalMillis(FASTEST_INTERVAL_MS)
                .setMinUpdateDistanceMeters(MIN_DISPLACEMENT_M)
                .build()

        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, mainLooper)
        } catch (e: SecurityException) {
            // Location permission was revoked between the JS permission check and start; stop gracefully.
            stopTracking()
        }
    }

    private fun stopTracking() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun emitLocation(location: Location) {
        val reactContext =
            (application as? ReactApplication)
                ?.reactNativeHost
                ?.reactInstanceManager
                ?.currentReactContext ?: return

        if (!reactContext.hasActiveReactInstance()) return

        val params =
            Arguments.createMap().apply {
                putDouble("latitude", location.latitude)
                putDouble("longitude", location.longitude)
                putDouble("accuracy", location.accuracy.toDouble())
                putDouble("speed", location.speed.toDouble())
                putDouble("heading", location.bearing.toDouble())
                putDouble("altitude", location.altitude)
                putDouble("timestamp", location.time.toDouble())
            }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NAME, params)
    }

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel =
                NotificationChannel(
                    CHANNEL_ID,
                    "Praćenje lokacije",
                    NotificationManager.IMPORTANCE_LOW
                )
            channel.description = "Aktivno dok ste onlajn, da bi dispečer video vašu poziciju."
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent =
            PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FlyBox Driver")
            .setContentText("Praćenje lokacije je aktivno")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }

    companion object {
        const val ACTION_START = "io.fleetbase.navigator.location.START"
        const val ACTION_STOP = "io.fleetbase.navigator.location.STOP"
        const val EVENT_NAME = "onLocationUpdate"

        private const val CHANNEL_ID = "flybox_location_tracking"
        private const val NOTIFICATION_ID = 51423
        private const val UPDATE_INTERVAL_MS = 15_000L
        private const val FASTEST_INTERVAL_MS = 10_000L
        private const val MIN_DISPLACEMENT_M = 25f
    }
}
