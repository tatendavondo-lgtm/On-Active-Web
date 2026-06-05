/**
 * Legacy-compatible UUID generator.
 * Older Android WebViews (e.g. Android 7 / Chrome 56 on Huawei MediaPad T3) 
 * do not support crypto.randomUUID(). This provides a safe fallback.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback using Math.random for environments without crypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
