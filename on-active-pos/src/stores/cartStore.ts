import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, HeldTransaction, AutoDiscount } from '../types/cart';
import { MAX_HELD_TRANSACTIONS } from '../config/constants';
import { calculateAutoDiscount } from '../lib/autoDiscount';

/**
 * Inline recalculation — operates directly on the immer draft.
 * MUST be called inside a set() callback, NOT as a nested set().
 */
function recalculate(state: CartState) {
  // 1. Subtotal
  state.subtotal = state.items.reduce((sum, i) => sum + i.line_total, 0);

  // 2. Auto discount (2% on $50+) — applied FIRST
  state.autoDiscount = calculateAutoDiscount(state.subtotal);

  // 3. Manual discount — applied on top of auto discount
  const afterAuto = state.subtotal - state.autoDiscount.amount;
  if (state.manualDiscountType === 'percentage' && state.manualDiscountValue) {
    state.manualDiscountAmount = Math.round(afterAuto * (state.manualDiscountValue / 100) * 100) / 100;
  } else if (state.manualDiscountType === 'fixed' && state.manualDiscountValue) {
    state.manualDiscountAmount = Math.min(state.manualDiscountValue, afterAuto);
  } else {
    state.manualDiscountAmount = 0;
  }

  // 4. Total discount
  state.totalDiscount = state.autoDiscount.amount + state.manualDiscountAmount;

  // 5. Tax (0 in Zimbabwe — VAT included)
  state.taxAmount = 0;

  // 6. Total
  state.total = Math.round((state.subtotal - state.totalDiscount + state.taxAmount) * 100) / 100;
}

interface CartState {
  items: CartItem[];
  heldTransactions: HeldTransaction[];
  manualDiscountType?: 'percentage' | 'fixed';
  manualDiscountValue?: number;

  // Computed
  subtotal: number;
  autoDiscount: AutoDiscount;
  manualDiscountAmount: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'line_total' | 'discount_amount'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyManualDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  clearManualDiscount: () => void;
  clearCart: () => void;
  loadFromSalesmanOrder: (items: CartItem[]) => void;
  holdTransaction: (note?: string, customerName?: string) => boolean;
  recallTransaction: (heldId: string) => void;
}

export const useCartStore = create<CartState>()(
  immer((set, get) => ({
    items: [],
    heldTransactions: [],
    manualDiscountType: undefined,
    manualDiscountValue: undefined,
    subtotal: 0,
    autoDiscount: { applied: false, percentage: 2, threshold: 50, amount: 0, original_total: 0, discounted_total: 0 },
    manualDiscountAmount: 0,
    totalDiscount: 0,
    taxAmount: 0,
    total: 0,

    addItem: (item) =>
      set((state) => {
        const existing = state.items.find(
          (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
        );
        if (existing) {
          const newQty = existing.quantity + item.quantity;
          existing.quantity = existing.max_stock !== undefined ? Math.min(existing.max_stock, newQty) : newQty;
          existing.line_total = existing.quantity * existing.unit_price;
        } else {
          state.items.push({
            ...item,
            id: crypto.randomUUID(),
            discount_amount: 0,
            line_total: item.quantity * item.unit_price,
          });
        }
        recalculate(state);
      }),

    removeItem: (itemId) =>
      set((state) => {
        state.items = state.items.filter((i) => i.id !== itemId);
        recalculate(state);
      }),

    updateQuantity: (itemId, quantity) =>
      set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter((i) => i.id !== itemId);
          } else {
            item.quantity = item.max_stock !== undefined ? Math.min(item.max_stock, quantity) : quantity;
            item.line_total = item.quantity * item.unit_price;
          }
        }
        recalculate(state);
      }),

    applyManualDiscount: (type, value) =>
      set((state) => {
        state.manualDiscountType = type;
        state.manualDiscountValue = value;
        recalculate(state);
      }),

    clearManualDiscount: () =>
      set((state) => {
        state.manualDiscountType = undefined;
        state.manualDiscountValue = undefined;
        recalculate(state);
      }),

    clearCart: () =>
      set((state) => {
        state.items = [];
        state.manualDiscountType = undefined;
        state.manualDiscountValue = undefined;
        state.subtotal = 0;
        state.autoDiscount = { applied: false, percentage: 2, threshold: 50, amount: 0, original_total: 0, discounted_total: 0 };
        state.manualDiscountAmount = 0;
        state.totalDiscount = 0;
        state.taxAmount = 0;
        state.total = 0;
      }),

    // Load items from a salesman order into the cart (for till operator)
    loadFromSalesmanOrder: (items) =>
      set((state) => {
        let parsedItems = items;
        if (typeof items === 'string') {
          try {
            parsedItems = JSON.parse(items);
          } catch (e) {
            parsedItems = [];
          }
        }
        if (!Array.isArray(parsedItems)) {
          parsedItems = [];
        }
        state.items = parsedItems.map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          // Ensure line_total is computed from unit_price
          line_total: (item.quantity || 1) * (Number(item.unit_price) || 0),
        }));
        state.manualDiscountType = undefined;
        state.manualDiscountValue = undefined;
        recalculate(state);
      }),

    holdTransaction: (note, customerName) => {
      const state = get();
      if (state.items.length === 0) return false;
      if (state.heldTransactions.length >= MAX_HELD_TRANSACTIONS) return false;

      set((s) => {
        s.heldTransactions.push({
          id: crypto.randomUUID(),
          cart: {
            items: [...s.items],
            subtotal: s.subtotal,
            auto_discount: { ...s.autoDiscount },
            manual_discount_amount: s.manualDiscountAmount,
            manual_discount_type: s.manualDiscountType,
            manual_discount_value: s.manualDiscountValue,
            total_discount: s.totalDiscount,
            tax_amount: s.taxAmount,
            total: s.total,
          },
          customer_name: customerName,
          held_at: new Date().toISOString(),
          note,
        });
        s.items = [];
        s.manualDiscountType = undefined;
        s.manualDiscountValue = undefined;
        s.subtotal = 0;
        s.autoDiscount = { applied: false, percentage: 2, threshold: 50, amount: 0, original_total: 0, discounted_total: 0 };
        s.manualDiscountAmount = 0;
        s.totalDiscount = 0;
        s.taxAmount = 0;
        s.total = 0;
      });
      return true;
    },

    recallTransaction: (heldId) =>
      set((state) => {
        const held = state.heldTransactions.find((h) => h.id === heldId);
        if (!held) return;
        if (state.items.length > 0) {
          state.heldTransactions.push({
            id: crypto.randomUUID(),
            cart: {
              items: [...state.items],
              subtotal: state.subtotal,
              auto_discount: { ...state.autoDiscount },
              manual_discount_amount: state.manualDiscountAmount,
              manual_discount_type: state.manualDiscountType,
              manual_discount_value: state.manualDiscountValue,
              total_discount: state.totalDiscount,
              tax_amount: state.taxAmount,
              total: state.total,
            },
            held_at: new Date().toISOString(),
          });
        }
        state.items = held.cart.items;
        state.manualDiscountType = held.cart.manual_discount_type;
        state.manualDiscountValue = held.cart.manual_discount_value;
        state.subtotal = held.cart.subtotal;
        state.autoDiscount = held.cart.auto_discount;
        state.manualDiscountAmount = held.cart.manual_discount_amount;
        state.totalDiscount = held.cart.total_discount;
        state.taxAmount = held.cart.tax_amount;
        state.total = held.cart.total;
        state.heldTransactions = state.heldTransactions.filter((h) => h.id !== heldId);
      }),
  }))
);
