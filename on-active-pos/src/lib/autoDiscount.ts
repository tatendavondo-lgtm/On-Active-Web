import { AUTO_DISCOUNT_THRESHOLD, AUTO_DISCOUNT_PERCENTAGE } from '../config/constants';
import type { AutoDiscount } from '../types/cart';

/**
 * Calculate the automatic 2% discount for orders >= $50.
 * This is applied automatically — no cashier action needed.
 */
export function calculateAutoDiscount(subtotal: number): AutoDiscount {
  const qualifies = subtotal >= AUTO_DISCOUNT_THRESHOLD;
  const amount = qualifies ? subtotal * (AUTO_DISCOUNT_PERCENTAGE / 100) : 0;

  return {
    applied: qualifies,
    percentage: AUTO_DISCOUNT_PERCENTAGE,
    threshold: AUTO_DISCOUNT_THRESHOLD,
    amount: Math.round(amount * 100) / 100,
    original_total: subtotal,
    discounted_total: Math.round((subtotal - amount) * 100) / 100,
  };
}
