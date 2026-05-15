import { useState, useEffect, useMemo } from 'react';
import { CheckSquare, Square, Trash2, Plus, Search, X } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { AutoDiscountBanner } from './AutoDiscountBanner';
import { PaymentModal } from './PaymentModal';
import { DiscountModal } from './DiscountModal';
import { QuantityControl } from '../salesman/QuantityControl';
import { formatUSD } from '../../lib/currency';
import { useSessionStore } from '../../stores/sessionStore';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { processOrder } from '../../lib/orderProcessing';
import { transformOrderToReceipt } from '../../lib/receipt';
import { ReceiptPreview } from '../receipt/ReceiptPreview';
import { Button } from '../shared/Button';
import { db } from '../../db/dexie';
import type { LocalProduct } from '../../db/dexie';
import type { SalesmanOrder } from '../../types/order';

interface VerifyOrderProps {
  order: SalesmanOrder;
  onCancel: () => void;
  onPay: () => void;
}

export function VerifyOrder({ order, onCancel, onPay }: VerifyOrderProps) {
  const { items, subtotal, loadFromSalesmanOrder, removeItem, updateQuantity, addItem, autoDiscount, manualDiscountAmount, manualDiscountType, totalDiscount, taxAmount, applyManualDiscount, total, clearCart } = useCartStore();
  const { employee, store, deviceId } = useSessionStore();
  const { rates } = useExchangeRates();
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);

  // Add Item modal state
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<LocalProduct[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Load products when add item modal opens
  useEffect(() => {
    if (addItemOpen) {
      db.products.toArray().then(setAllProducts);
      setSearchTerm('');
      setExpandedProduct(null);
    }
  }, [addItemOpen]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }, [allProducts, searchTerm]);

  const handleAddProduct = (product: LocalProduct, variant: LocalProduct['variants'][0]) => {
    addItem({
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      variant_name: variant.name !== 'Standard' ? variant.name : undefined,
      sku: variant.sku || product.sku,
      quantity: 1,
      unit_price: Number(variant.price) || Number((product as any).price_usd) || 0,
    });
    setAddItemOpen(false);
  };

  useEffect(() => {
    const handleTriggerPayment = () => {
      if (verifiedItems.size === order.items.length && !showPayment && !completedReceipt) {
        setShowPayment(true);
      }
    };
    window.addEventListener('pos-trigger-payment', handleTriggerPayment);
    return () => window.removeEventListener('pos-trigger-payment', handleTriggerPayment);
  }, [verifiedItems.size, order.items.length, showPayment, completedReceipt]);

  const handleCompleteSale = async (payments: any[]) => {
    if (!employee || !store) return;
    
    try {
      const processedOrder = await processOrder({
        storeId: store.id,
        employeeId: employee.id,
        deviceId: deviceId || 'unknown',
        source: 'salesman',
        salesmanId: order.salesman_id,
        salesmanOrderId: order.id,
        items: order.items,
        payments,
        subtotal,
        autoDiscount,
        manualDiscountAmount,
        manualDiscountType: manualDiscountType || null,
        totalDiscount,
        taxAmount,
        total,
        exchangeRateZig: rates.ZIG,
        exchangeRateZar: rates.ZAR,
      });

      const receiptData = transformOrderToReceipt(processedOrder as any, store, employee.full_name, order.salesman_name);
      setCompletedReceipt(receiptData);

      setShowPayment(false);
      clearCart();
    } catch (err) {
      console.error('Failed to process order', err);
      alert('Failed to process order.');
    }
  };

  // Load order into cart store on mount, and auto-verify all items
  useEffect(() => {
    loadFromSalesmanOrder(order.items as any[]);
  }, [order, loadFromSalesmanOrder]);

  // Auto-verify items once they appear in the cart
  useEffect(() => {
    if (items.length > 0 && verifiedItems.size === 0) {
      setVerifiedItems(new Set(items.map(i => i.id)));
    }
  }, [items]);

  const toggleVerify = (id: string) => {
    const next = new Set(verifiedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVerifiedItems(next);
  };

  const allVerified = items.length > 0 && items.every(i => verifiedItems.has(i.id));

  return (
    <div className="flex flex-col h-full bg-[var(--pos-surface-elevated)] border-l border-[var(--pos-border)] relative">
      <div className="p-4 border-b border-[var(--pos-border)] flex-shrink-0 bg-[var(--pos-surface)]">
        <h2 className="text-lg font-semibold text-white truncate">
          {order.customer_name || 'Walk-in Customer'}
        </h2>
        <div className="flex justify-between text-sm text-[var(--pos-text-secondary)] mt-1">
          <span>By {order.salesman_name}</span>
          <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {items.map(item => (
          <div key={item.id} className={`flex flex-col gap-3 p-3 rounded-[var(--pos-radius)] border transition-colors ${
            verifiedItems.has(item.id) 
              ? 'bg-[var(--pos-success)]/5 border-[var(--pos-success)]/30' 
              : 'bg-[var(--pos-surface)] border-[var(--pos-border)]'
          }`}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleVerify(item.id)} className="mt-0.5 text-[var(--pos-text-muted)] hover:text-white transition-colors">
                {verifiedItems.has(item.id) ? <CheckSquare className="text-[var(--pos-success)]" /> : <Square />}
              </button>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-sm text-white line-clamp-1">{item.product_name}</span>
                    {item.variant_name && <span className="text-xs text-[var(--pos-text-muted)]">{item.variant_name}</span>}
                  </div>
                  <button 
                    onClick={() => {
                      removeItem(item.id);
                      const next = new Set(verifiedItems);
                      next.delete(item.id);
                      setVerifiedItems(next);
                    }}
                    className="text-[var(--pos-text-muted)] hover:text-[var(--pos-error)] transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <QuantityControl 
                    quantity={item.quantity} 
                    onChange={(q) => {
                      updateQuantity(item.id, q);
                      const next = new Set(verifiedItems);
                      next.delete(item.id);
                      setVerifiedItems(next);
                    }} 
                    min={1} 
                  />
                  <span className="font-mono text-[var(--pos-accent)] font-medium">
                    {formatUSD(item.line_total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button variant="ghost" className="w-full mt-4 border border-dashed border-[var(--pos-border)]" onClick={() => setAddItemOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Missed Item
        </Button>
      </div>

      <div className="p-4 border-t border-[var(--pos-border)] bg-[var(--pos-surface)] flex-shrink-0 flex flex-col gap-4">
        {autoDiscount.applied && <AutoDiscountBanner autoDiscount={autoDiscount} />}
        
        <div className="space-y-2 text-sm w-full mb-4">
          <div className="flex justify-between text-[var(--pos-text-secondary)]">
            <span>Subtotal</span>
            <span className="font-mono">{formatUSD(subtotal)}</span>
          </div>
          {manualDiscountAmount > 0 && (
            <div className="flex justify-between text-[#10B981]">
              <span>Manual Discount</span>
              <span className="font-mono">-{formatUSD(manualDiscountAmount)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-xl font-bold w-full pt-2 border-t border-[var(--pos-border-subtle)]">
          <span>Total</span>
          <span className="font-mono text-[var(--pos-success)]">{formatUSD(total)}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          <Button variant="ghost" onClick={onCancel} className="col-span-1 px-2 text-xs">
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => setShowDiscount(true)} className="col-span-1 px-2 text-xs">
            Discount
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowPayment(true)} 
            disabled={!allVerified || items.length === 0}
            className={`col-span-1 px-2 text-xs ${allVerified ? 'bg-[var(--pos-success)] text-white shadow-lg shadow-[var(--pos-success)]/20' : ''}`}
          >
            Pay
          </Button>
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        autoDiscount={autoDiscount}
        onComplete={handleCompleteSale}
      />
      
      <DiscountModal
        isOpen={showDiscount}
        onClose={() => setShowDiscount(false)}
        subtotal={subtotal}
        autoDiscount={autoDiscount}
        onApply={(amount, type) => applyManualDiscount(type, amount)}
      />

      {completedReceipt && (
        <div className="fixed inset-0 z-[100] bg-[var(--pos-bg)]/95 flex items-center justify-center overflow-y-auto p-4 custom-scrollbar">
          <ReceiptPreview 
            data={completedReceipt} 
            onNewSale={() => {
              setCompletedReceipt(null);
              onPay();
            }} 
          />
        </div>
      )}

      {/* Add Item Modal */}
      {addItemOpen && (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[var(--pos-border)] flex items-center gap-3">
              <Search className="w-4 h-4 text-[var(--pos-text-muted)]" />
              <input
                autoFocus
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-[var(--pos-text-muted)] focus:outline-none"
              />
              <button onClick={() => setAddItemOpen(false)} className="text-[var(--pos-text-muted)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-[var(--pos-text-muted)]">No products found</div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="border-b border-[var(--pos-border)] last:border-0">
                    <button
                      onClick={() => {
                        if (product.variants.length === 1) {
                          const v = product.variants[0];
                          if (v.stock > 0) handleAddProduct(product, v);
                        } else {
                          setExpandedProduct(expandedProduct === product.id ? null : product.id);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[var(--pos-surface-hover)] transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-[var(--pos-surface)] rounded-[var(--pos-radius)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-[var(--pos-text-muted)] font-bold">OA</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white truncate">{product.name}</div>
                        <div className="text-xs text-[var(--pos-text-muted)]">
                          {product.variants.length > 1 ? `${product.variants.length} variants` : product.variants[0]?.name || 'Standard'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-sm text-[var(--pos-accent)]">{formatUSD(product.variants[0]?.price || 0)}</div>
                        <div className="text-xs text-[var(--pos-text-muted)]">{product.variants.reduce((s, v) => s + v.stock, 0)} in stock</div>
                      </div>
                    </button>
                    {expandedProduct === product.id && product.variants.length > 1 && (
                      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                        {product.variants.map(v => (
                          <button
                            key={v.id}
                            disabled={v.stock <= 0}
                            onClick={() => handleAddProduct(product, v)}
                            className={`p-2 rounded-[var(--pos-radius)] border text-left text-sm transition-all ${
                              v.stock <= 0
                                ? 'opacity-40 border-[var(--pos-border)] cursor-not-allowed'
                                : 'border-[var(--pos-border)] hover:border-[var(--pos-accent)] hover:bg-[var(--pos-accent)]/5'
                            }`}
                          >
                            <div className="font-medium text-white">{v.name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="font-mono text-xs text-[var(--pos-accent)]">{formatUSD(v.price)}</span>
                              <span className={`text-xs ${v.stock <= 5 ? 'text-amber-400' : 'text-[var(--pos-text-muted)]'}`}>
                                {v.stock <= 0 ? 'Out' : `${v.stock} left`}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
