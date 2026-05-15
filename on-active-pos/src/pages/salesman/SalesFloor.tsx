import { ProductBrowser } from '../../components/salesman/ProductBrowser';
import { OrderBuilder } from '../../components/salesman/OrderBuilder';

export default function SalesFloor() {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 border-r border-[var(--pos-border)] flex flex-col h-full overflow-hidden">
        <ProductBrowser />
      </div>
      <div className="w-[var(--pos-cart-width)] bg-[var(--pos-surface)] h-full flex flex-col overflow-hidden">
        <OrderBuilder />
      </div>
    </div>
  );
}
