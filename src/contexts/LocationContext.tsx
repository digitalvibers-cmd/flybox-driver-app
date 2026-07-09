import React, { createContext, useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import BackgroundFetch from 'react-native-background-fetch';
import { Place, Point } from '@fleetbase/sdk';
import { isEmpty } from '../utils';
import { haversine } from '../utils/math';
import { useAuth } from './AuthContext';
import useStorage from '../hooks/use-storage';
import useFleetbase from '../hooks/use-fleetbase';
import { ensureLocationPermissions, startLocationService, stopLocationService, addLocationListener } from '../services/location-tracking';

// Configure the foreground geolocation library (used for one-shot current-position reads).
Geolocation.setRNConfiguration({ skipPermissionRequests: false, authorizationLevel: 'whenInUse', locationProvider: 'auto' });

// Throttle for pushing positions to the API: send at most every 30s, unless the
// driver moved more than 50m since the last sent fix.
const TRACK_MIN_INTERVAL_MS = 30_000;
const TRACK_MIN_DISTANCE_M = 50;

const LocationContext = createContext({
    location: null,
    isTracking: false,
    startTracking: () => {},
    stopTracking: () => {},
});

export const LocationProvider = ({ children }) => {
    const { isOnline, driver, trackDriver } = useAuth();
    const { adapter } = useFleetbase();
    const [location, setLocation] = useStorage(`${driver?.id ?? 'anon'}_location`, {});
    const [isTracking, setIsTracking] = useState(false);

    // Native foreground-service location listener subscription.
    const locationSubscription = useRef(null);
    // Keep the latest trackDriver in a ref so the native listener never holds a stale closure.
    const trackDriverRef = useRef(trackDriver);
    useEffect(() => {
        trackDriverRef.current = trackDriver;
    }, [trackDriver]);

    // Last position actually sent to the API — used to throttle track() calls.
    const lastSentRef = useRef({ timestamp: 0, coords: null });

    // Push a position to the API only if enough time has passed or the driver
    // moved far enough since the last sent fix. Local state still updates on
    // every fix, so this only reduces network traffic, not UI freshness.
    const sendTrackedPosition = useCallback((coords, { force = false } = {}) => {
        const { timestamp, coords: lastCoords } = lastSentRef.current;
        const elapsedMs = Date.now() - timestamp;
        const movedMeters = lastCoords ? haversine([coords.latitude, coords.longitude], [lastCoords.latitude, lastCoords.longitude]) : Infinity;

        if (!force && elapsedMs < TRACK_MIN_INTERVAL_MS && movedMeters < TRACK_MIN_DISTANCE_M) {
            return;
        }

        lastSentRef.current = { timestamp: Date.now(), coords: { latitude: coords.latitude, longitude: coords.longitude } };
        Promise.resolve(trackDriverRef.current(coords)).catch((err) => {
            console.warn('[LocationTracking] failed to push position to API:', err);
        });
    }, []);

    // Manually read the current location once (foreground) and push it to the API.
    const trackLocation = useCallback(async () => {
        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    setLocation(position);
                    // Manual one-shot reads (background fetch, initial fix) always send.
                    sendTrackedPosition(position.coords, { force: true });
                    resolve(position);
                },
                (error) => {
                    console.warn('Error attempting to track and update location:', error);
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    }, [setLocation, sendTrackedPosition]);

    // Get the drivers location as a Place
    const getDriverLocationAsPlace = useCallback(
        (attributes = {}) => {
            const { coords } = location;

            return new Place(
                {
                    id: 'driver',
                    name: 'Lokacija vozača',
                    street1: 'Lokacija vozača',
                    location: new Point(coords.latitude, coords.longitude),
                    ...attributes,
                },
                adapter
            );
        },
        [location, adapter]
    );

    // Handle a location fix streamed from the native foreground service.
    // Native emits a flat payload; normalize to the { coords, timestamp } shape used elsewhere.
    const onNativeLocation = useCallback(
        (event) => {
            const position = {
                coords: {
                    latitude: event.latitude,
                    longitude: event.longitude,
                    accuracy: event.accuracy,
                    speed: event.speed,
                    heading: event.heading,
                    altitude: event.altitude,
                },
                timestamp: event.timestamp,
            };

            setLocation(position);
            sendTrackedPosition(position.coords);
        },
        [setLocation, sendTrackedPosition]
    );

    // Function to start tracking (permissions -> native listener -> foreground service).
    const startTracking = useCallback(async () => {
        const granted = await ensureLocationPermissions();
        if (!granted) {
            console.warn('[LocationTracking] location permission not granted; tracking disabled');
            return;
        }

        if (!locationSubscription.current) {
            locationSubscription.current = addLocationListener(onNativeLocation);
        }

        await startLocationService();
        setIsTracking(true);
    }, [onNativeLocation]);

    // Function to stop tracking.
    const stopTracking = useCallback(async () => {
        await stopLocationService();

        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }

        setIsTracking(false);
    }, []);

    // Toggle tracking based on the driver's online status.
    useEffect(() => {
        if (!driver) return;

        if (isOnline) {
            startTracking();
        } else {
            stopTracking();
        }

        if (isEmpty(location) && driver) {
            trackLocation();
        }
        // Keyed on driver id (stable across reloads) to avoid re-subscribing on every track() update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [driver?.id, isOnline]);

    // Clean up the native listener when the provider unmounts.
    useEffect(() => {
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
                locationSubscription.current = null;
            }
        };
    }, []);

    // Configure BackgroundFetch as a periodic safety-net (Android clamps the minimum to ~15 min).
    useEffect(() => {
        BackgroundFetch.configure(
            {
                minimumFetchInterval: 15,
                stopOnTerminate: false,
                startOnBoot: true,
            },
            async (taskId) => {
                await trackLocation();
                BackgroundFetch.finish(taskId);
            },
            (error) => {
                console.warn('[BackgroundFetch] failed to configure:', error);
            }
        );
    }, [trackLocation]);

    // Memoize the context value to prevent unnecessary re-renders.
    const value = useMemo(
        () => ({ location, isTracking, startTracking, stopTracking, getDriverLocationAsPlace, trackLocation }),
        [location, isTracking, startTracking, stopTracking, getDriverLocationAsPlace, trackLocation]
    );

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

// Custom hook to use the LocationContext.
export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
