import { db } from '../db/dexie';
import { ORDER_PREFIX } from '../config/constants';

export async function generateOrderNumber(storeCode: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `${ORDER_PREFIX}-${storeCode}-${dateStr}`;

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const count = await db.orders
    .where('created_at')
    .aboveOrEqual(todayStart)
    .count();

  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
}
