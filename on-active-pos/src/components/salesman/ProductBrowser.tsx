import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { SearchBar } from './SearchBar';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { CATEGORIES } from '../../config/constants';
import type { LocalProduct } from '../../db/dexie';
import { useCartStore } from '../../stores/cartStore';

export function ProductBrowser() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const addItem = useCartStore(s => s.addItem);

  const products: LocalProduct[] = useLiveQuery(() => db.products.toArray()) || [];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'all' || p.category.toLowerCase() === category.toLowerCase();
      const matchSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, search, category]);

  const handleSearchSubmit = () => {
    if (!search) return;

    // Find product with exact SKU matching (either product SKU or variant SKU)
    const exactMatch = products.find(p => 
      p.sku?.toLowerCase() === search.toLowerCase() ||
      p.variants.some(v => v.sku?.toLowerCase() === search.toLowerCase())
    );

    if (exactMatch) {
      const matchingVariant = exactMatch.variants.find(v => v.sku?.toLowerCase() === search.toLowerCase()) || exactMatch.variants[0];
      if (matchingVariant && matchingVariant.stock > 0) {
        addItem({
          product_id: exactMatch.id,
          variant_id: matchingVariant.id,
          product_name: exactMatch.name,
          variant_name: matchingVariant.name !== 'base' && matchingVariant.name !== 'Standard' ? matchingVariant.name : undefined,
          sku: matchingVariant.sku || exactMatch.sku,
          quantity: 1,
          max_stock: matchingVariant.stock,
          unit_price: Number(matchingVariant.price) || Number((exactMatch as any).price_usd) || 0
        });
        setSearch(''); // Reset search bar
        return;
      }
    }

    // Fallback: If only 1 product filtered, add it
    if (filtered.length === 1) {
      const singleProduct = filtered[0];
      if (singleProduct.variants.length === 1) {
        const v = singleProduct.variants[0];
        if (v.stock > 0) {
          addItem({
            product_id: singleProduct.id,
            variant_id: v.id,
            product_name: singleProduct.name,
            variant_name: v.name !== 'base' && v.name !== 'Standard' ? v.name : undefined,
            sku: v.sku || singleProduct.sku,
            quantity: 1,
            max_stock: v.stock,
            unit_price: Number(v.price) || Number((singleProduct as any).price_usd) || 0
          });
          setSearch('');
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} onSubmit={handleSearchSubmit} />
        </div>
      </div>
      
      <div>
        <CategoryBar 
          categories={CATEGORIES.map(c => ({ id: c.id, label: c.label }))}
          activeId={category}
          onChange={setCategory}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--pos-text-muted)]">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
