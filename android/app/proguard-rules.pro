# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class io.fleetbase.navigator.BuildConfig { *; }

# Most RN libraries ship consumer proguard rules; the rules below cover the
# ones that rely on reflection without shipping their own.

# Hermes / RN JNI internals
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# react-native-notifications resolves handlers reflectively
-keep class com.wix.reactnativenotifications.** { *; }

# ML Kit barcode scanner (VisionCamera code scanner)
-keep class com.google.mlkit.** { *; }

-dontwarn okhttp3.**
-dontwarn okio.**
