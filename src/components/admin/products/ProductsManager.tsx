'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Shirt, Search } from 'lucide-react';
import type { Product } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { formatUSD } from '@/lib/admin/utils';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { TableRowSkeleton } from '../ui/SkeletonLoader';
import { ProductModal } from './ProductModal';
import toast from 'react-hot-toast';

interface ProductsManagerProps {
  userRole: string;
}

type ProductSortOption = 'newest' | 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';

export function ProductsManager({ userRole }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Product | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'low_stock'>('all');
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load products');
    else setProducts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = products.filter(p => {
      if (categoryFilter !== 'all' && (p.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'hidden' && p.is_active) return false;
      if (statusFilter === 'low_stock' && (p.stock_quantity || 0) > 5) return false;
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSlug = (p.slug || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchCat) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price_asc') return (Number(a.price_usd) || 0) - (Number(b.price_usd) || 0);
      if (sortBy === 'price_desc') return (Number(b.price_usd) || 0) - (Number(a.price_usd) || 0);
      if (sortBy === 'stock_asc') return (Number(a.stock_quantity) || 0) - (Number(b.stock_quantity) || 0);
      if (sortBy === 'stock_desc') return (Number(b.stock_quantity) || 0) - (Number(a.stock_quantity) || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const toggleActive = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
      .eq('id', product.id);
    if (error) toast.error('Failed to update');
    else { toast.success(product.is_active ? 'Product hidden' : 'Product active'); fetchProducts(); }
  };

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const stockColor = (qty: number) =>
    qty === 0 ? 'text-red-400' : qty <= 5 ? 'text-amber-400' : 'text-[#C5A021]';

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] pl-9 pr-3 py-2 text-white text-xs outline-none focus:border-[#C5A021]/50 placeholder:text-[#444]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#111] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-xs outline-none focus:border-[#C5A021]/50"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#111] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-xs outline-none focus:border-[#C5A021]/50"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
            <option value="low_stock">Low / Out of Stock (≤5)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
            className="bg-[#111] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-xs outline-none focus:border-[#C5A021]/50"
          >
            <option value="newest">Sort: Newest</option>
            <option value="name_asc">Sort: Name (A–Z)</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="stock_asc">Stock: Low → High</option>
            <option value="stock_desc">Stock: High → Low</option>
          </select>
        </div>

        <button
          id="add-product-btn"
          onClick={() => setEditTarget('new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C5A021] text-black text-sm font-bold rounded-[6px] hover:bg-[#A6861C] transition-colors shrink-0"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
          <table className="w-full"><tbody>{[1,2,3,4,5].map(i=><TableRowSkeleton key={i} cols={7}/>)}</tbody></table>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px]">
          <EmptyState
            icon={Shirt}
            title="No products yet"
            description="Add your first product to start selling."
            action={{ label: 'Add Product', onClick: () => setEditTarget('new') }}
          />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px]">
          <EmptyState
            icon={Shirt}
            title="No matching products"
            description="Try adjusting your search or filter criteria."
            action={{ label: 'Reset Filters', onClick: () => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); } }}
          />
        </div>
      ) : (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#181818]">
                  {['Image', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[#444] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.2 }}
                    className="border-b border-[#141414] hover:bg-[#161616] transition-colors duration-100"
                  >
                    <td className="px-4 py-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-[4px] bg-[#1a1a1a]"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center">
                          <Shirt size={14} className="text-[#333]" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{product.name}</p>
                      <p className="text-[#444] text-xs">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#666] text-sm">{product.category ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white text-sm font-semibold">{formatUSD(product.price_usd)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-black text-xs font-mono tracking-tighter ${stockColor(product.stock_quantity)}`}>
                        {product.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          product.is_active
                            ? 'text-[#C5A021] hover:text-[#C5A021]/70'
                            : 'text-[#444] hover:text-white'
                        }`}
                      >
                        {product.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                        {product.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditTarget(product)}
                          className="p-1.5 text-[#444] hover:text-white hover:bg-[#1f1f1f] rounded-[4px] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        {userRole === 'owner' && (
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-[4px] transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={!!editTarget}
        product={editTarget === 'new' ? null : editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); fetchProducts(); }}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        danger
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently deleted and removed from the store.`}
        confirmLabel="Delete Product"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
