import { useState } from 'react';
import { getCurrentPosition, isWithinGeofence } from '../lib/geofence';
import type { Store } from '../types/store';

export function useGeofence() {
  const [checking, setChecking] = useState(false);

  async function checkGeofence(store: Store) {
    setChecking(true);
    try {
      const position = await getCurrentPosition();
      const targetLat = store.latitude ?? -17.864004;
      const targetLng = store.longitude ?? 30.862077;
      
      const result = isWithinGeofence(
        position.coords.latitude, position.coords.longitude,
        targetLat, targetLng,
        store.geofence_radius_meters || 50 // Default to 50m radius if null
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
