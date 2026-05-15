import { useState } from 'react';
import { getCurrentPosition, isWithinGeofence } from '../lib/geofence';
import type { Store } from '../types/store';

export function useGeofence() {
  const [checking, setChecking] = useState(false);

  async function checkGeofence(store: Store) {
    setChecking(true);
    try {
      const position = await getCurrentPosition();
      const result = isWithinGeofence(
        position.coords.latitude, position.coords.longitude,
        store.latitude, store.longitude,
        store.geofence_radius_meters
      );
      return result.allowed
        ? { allowed: true, distance: result.distance }
        : {
            allowed: false,
            distance: result.distance,
            error: `You must be within ${store.geofence_radius_meters}m of ${store.name}. You are ${result.distance}m away.`,
          };
    } catch (err: any) {
      console.warn('Geofence check failed:', err.message);
      return { allowed: true, distance: 0, error: 'Location unavailable — login allowed with warning.' };
    } finally {
      setChecking(false);
    }
  }

  return { checkGeofence, checking };
}
