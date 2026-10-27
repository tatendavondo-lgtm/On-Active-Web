import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { SearchBar } from './SearchBar';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { CATEGORIES } from '../../config/constants';
import type { LocalProduct } from '../../db/dexie';
import { useCartStore } from '../../stores/cartStore';

type SortOption = 'name_asc' | 'price_asc' | 'price_desc' | 'stock_desc';

function matchesPosCategory(productCategory: string | undefined, selectedCategory: string): boolean {
  if (selectedCategory === 'all') return true;
  const cat = (productCategory || '').toLowerCase().trim();
  const sel = selectedCategory.toLowerCase().trim();
  if (sel === 'upper') {
    return ['upper', 'tops', 'top', 'outerwear', 'sports bras', 'bras', 'jackets', 'hoodies', 't-shirts', 'shirts'].includes(cat);
  }
  if (sel === 'lower') {
    return ['lower', 'bottoms', 'bottom', 'leggings', 'shorts', 'joggers', 'pants', 'sweatpants'].includes(cat);
  }
  if (sel === 'sets') {
    return ['sets', 'set', 'tracksuits', 'tracksuit', 'twinsets'].includes(cat);
  }
  if (sel === 'accessories') {
    return ['accessories', 'accessory', 'bags', 'socks', 'caps', 'hats', 'bottles', 'gear'].includes(cat);
  }
  return cat === sel;
}

export function ProductBrowser() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const addItem = useCartStore(s => s.addItem);

  const products: LocalProduct[] = useLiveQuery(() => db.products.toArray()) || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = products.filter((p) => {
      const matchCat = matchesPosCategory(p.category, category);
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.variants && p.variants.some(v => v.sku?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q)));
      return matchCat && matchSearch;
    });

    return [...list].sort((a, b) => {
      const priceA = Number(a.variants?.[0]?.price) || Number((a as any).price_usd) || 0;
      const priceB = Number(b.variants?.[0]?.price) || Number((b as any).price_usd) || 0;
      const stockA = (a.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      const stockB = (b.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'stock_desc') return stockB - stockA;
      return a.name.localeCompare(b.name);
    });
  }, [products, search, category, sortBy]);

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
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} onSubmit={handleSearchSubmit} />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Sort products"
          className="h-12 px-3 rounded-xl bg-[var(--pos-bg-surface)] border border-[var(--pos-border)] text-xs font-bold text-[var(--pos-text-primary)] outline-none focus:border-[var(--pos-accent)]"
        >
          <option value="name_asc">Sort: Name (A–Z)</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="stock_desc">Stock: High → Low</option>
        </select>
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
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--pos-text-muted)]">
            <span>No products found.</span>
            {(category !== 'all' || search) && (
              <button
                type="button"
                onClick={() => { setCategory('all'); setSearch(''); }}
                className="px-4 py-1.5 rounded-lg bg-[var(--pos-bg-elevated)] border border-[var(--pos-border)] text-xs font-bold text-[var(--pos-accent)] hover:opacity-80"
              >
                Reset Filters
              </button>
            )}
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
