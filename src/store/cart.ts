import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void; // Using productId-size as id
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;
  getCartCount: () => number;
  getCartTotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (newItem) => set((state) => {
        const id = `${newItem.productId}-${newItem.size}`;
        const existingItem = state.items.find(item => `${item.productId}-${item.size}` === id);

        if (existingItem) {
          return {
            items: state.items.map(item =>
              `${item.productId}-${item.size}` === id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }

        return {
          items: [...state.items, { ...newItem, quantity: 1 }],
        };
      }),

      removeItem: (id: string) => set((state) => ({
        items: state.items.filter(item => `${item.productId}-${item.size}` !== id)
      })),

      updateQuantity: (id: string, quantity: number) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter(item => `${item.productId}-${item.size}` !== id) };
        }
        return {
          items: state.items.map(item =>
            `${item.productId}-${item.size}` === id ? { ...item, quantity } : item
          )
        };
      }),

      clearCart: () => set({ items: [] }),

      setIsCartOpen: (isOpen: boolean) => set({ isCartOpen: isOpen }),

      getCartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price_usd * item.quantity), 0);
      }
    }),
    {
      name: 'on-active-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
