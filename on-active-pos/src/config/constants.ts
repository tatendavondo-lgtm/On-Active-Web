export const APP_NAME = 'On Active POS';
export const CURRENCY_PRIMARY = 'USD';
export const CURRENCIES_DISPLAY = ['ZIG', 'ZAR'] as const;

export const AUTO_DISCOUNT_THRESHOLD = 50;    // USD
export const AUTO_DISCOUNT_PERCENTAGE = 2;    // %
export const MANUAL_DISCOUNT_SUPERVISOR_THRESHOLD = 20; // % — above this requires supervisor PIN

export const DEFAULT_TAX_RATE = 0;
export const MAX_HELD_TRANSACTIONS = 5;
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
export const PIN_MAX_ATTEMPTS = 5;
export const GEOFENCE_DEFAULT_RADIUS = 20;    // meters — tight geofence
export const SYNC_RETRY_MAX = 5;
export const DEVICE_ID_KEY = 'oa_pos_device_id';
export const ORDER_PREFIX = 'OA';
export const EXCHANGE_RATE_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'upper', label: 'Upper' },
  { id: 'lower', label: 'Lower' },
  { id: 'sets', label: 'Sets' },
  { id: 'accessories', label: 'Accessories' },
] as const;
