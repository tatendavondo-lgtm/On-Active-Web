import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { SearchBar } from './SearchBar';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { CATEGORIES } from '../../config/constants';
import type { LocalProduct } from '../../db/dexie';

export function ProductBrowser() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

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

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
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
