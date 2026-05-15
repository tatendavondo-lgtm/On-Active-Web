import type { Store } from '../types/store';

export const DEFAULT_STORES: Store[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'On Active — Harare CBD',
    code: 'HRE',
    address: '123 First Street, Harare',
    latitude: -17.8292,
    longitude: 31.0522,
    geofence_radius_meters: 20,
    timezone: 'Africa/Harare',
    phone: '+263 242 000 000',
    is_active: true,
  },
];
