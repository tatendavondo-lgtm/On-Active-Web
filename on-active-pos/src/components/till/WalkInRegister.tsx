import { useEffect } from 'react';
import { ProductBrowser } from '../salesman/ProductBrowser';
import { CartPanel } from './CartPanel';
import { useCartStore } from '../../stores/cartStore';

export function WalkInRegister() {
  const clearCart = useCartStore(s => s.clearCart);

  // Clear cart when mounting walk-in register to ensure clean slate
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex h-full w-full bg-[var(--pos-bg)]">
      <div className="flex-1 border-r border-[var(--pos-border)] flex flex-col h-full overflow-hidden">
        <ProductBrowser />
      </div>
      <div className="w-[var(--pos-cart-width)] bg-[var(--pos-surface)] h-full flex flex-col overflow-hidden">
        <CartPanel />
      </div>
    </div>
  );
}
