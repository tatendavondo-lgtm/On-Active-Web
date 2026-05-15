export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  timezone: string;
  phone: string;
  is_active: boolean;
}
