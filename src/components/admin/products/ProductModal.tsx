'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload } from 'lucide-react';
import type { Product } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, formatUSD } from '@/lib/admin/utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['Tops', 'Bottoms', 'Leggings', 'Sports Bras', 'Shorts', 'Sets', 'Accessories', 'Outerwear'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

interface Variant {
  id?: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

interface ProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

interface HierarchicalSize {
  size: string;
  quantity: number;
  colors: { color: string; quantity: number }[];
}

export function ProductModal({ isOpen, product, onClose, onSaved }: ProductModalProps) {
  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: '', gender: 'All',
    price_usd: '', sizes: [] as string[], stock_quantity: '',
    images: [] as string[], is_active: true, is_featured: false, is_trending: false,
  });
  const [hierarchicalSizes, setHierarchicalSizes] = useState<HierarchicalSize[]>([]);
  
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<string | null>(null);

  useEffect(() => {
    if (product && isOpen) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        category: product.category ?? '',
        gender: product.gender ?? 'All',
        price_usd: String(product.price_usd),
        sizes: product.sizes ?? [],
        stock_quantity: String(product.stock_quantity),
        images: product.images ?? [],
        is_active: product.is_active,
        is_featured: product.is_featured ?? false,
        is_trending: product.is_trending ?? false,
      });
      
      const fetchVariants = async () => {
        const supabase = createClient();
        const { data: vars } = await supabase
          .from('product_variants')
          .select('*, store_inventory(quantity)')
          .eq('product_id', product.id);
        
        if (vars) {
          const mappedVariants = vars.map(v => ({
            id: v.id,
            size: v.size || '',
            color: v.color || '',
            price: v.price || product.price_usd,
            stock: v.store_inventory?.[0]?.quantity || 0
          }));

          const h: HierarchicalSize[] = [];
          mappedVariants.forEach(v => {
            let sizeEntry = h.find(s => s.size === v.size);
            if (!sizeEntry) {
              sizeEntry = { size: v.size, quantity: 0, colors: [] };
              h.push(sizeEntry);
            }
            sizeEntry.quantity += v.stock;
            if (v.color) {
              sizeEntry.colors.push({ color: v.color, quantity: v.stock });
            }
          });
          setHierarchicalSizes(h);
        }
      };
      fetchVariants();
      setFiles([]);
    } else if (!product && isOpen) {
      setForm({ name: '', slug: '', description: '', category: '', gender: 'All', price_usd: '', sizes: [], stock_quantity: '', images: [], is_active: true, is_featured: false, is_trending: false });
      setHierarchicalSizes([]);
      setFiles([]);
      setActiveSizeTab(null);
    }
  }, [product, isOpen]);

  const derivedVariants: Variant[] = [];
  hierarchicalSizes.forEach(s => {
    if (s.colors.length > 0) {
      s.colors.forEach(c => {
        derivedVariants.push({
          size: s.size,
          color: c.color,
          price: parseFloat(form.price_usd) || 0,
          stock: c.quantity
        });
      });
    } else if (s.quantity > 0) {
      derivedVariants.push({
        size: s.size,
        color: '',
        price: parseFloat(form.price_usd) || 0,
        stock: s.quantity
      });
    }
  });

  const totalAllocatedToSizes = hierarchicalSizes.reduce((sum, s) => sum + s.quantity, 0);
  const remainingForSizes = (parseInt(form.stock_quantity) || 0) - totalAllocatedToSizes;

  const handleSave = async () => {
    // 1. Detailed Validation & Friendly Error Messages
    if (!form.name.trim()) {
      toast.error('Please enter a Product Name.', { id: 'val-name' });
      return;
    }

    const price = parseFloat(form.price_usd);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid Base Price (e.g. 29.99).', { id: 'val-price' });
      return;
    }

    const totalStock = parseInt(form.stock_quantity);
    if (isNaN(totalStock) || totalStock < 0) {
      toast.error('Please specify the Total Product Inventory.', { id: 'val-stock' });
      return;
    }

    const totalAllocated = derivedVariants.reduce((sum, v) => sum + v.stock, 0);
    if (totalAllocated !== totalStock) {
      toast.error(`Allocation Mismatch: You have ${totalStock} total items, but allocated ${totalAllocated} to sizes. They must match exactly!`, { id: 'val-alloc', duration: 5000 });
      return;
    }

    if (derivedVariants.length === 0 && totalStock > 0) {
      toast.error('Please allocate the stock to at least one size (e.g. click "M" and enter the quantity).', { id: 'val-size', duration: 5000 });
      return;
    }

    if (form.images.length === 0 && files.length === 0) {
      toast.error('Please upload at least one image for the product.', { id: 'val-img' });
      return;
    }

    setSaving(true);

    try {
      // 2. Upload Images Concurrently (Massive Speed Boost)
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) {
          throw new Error(uploadData.error || `Failed to upload ${file.name}`);
        }
        return uploadData.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

    const payload = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description || null,
      category: form.category || null,
      gender: form.gender,
      price_usd: parseFloat(form.price_usd),
      sizes: Array.from(new Set(derivedVariants.map(v => v.size))),
      stock_quantity: totalStock,
      images: [...form.images, ...uploadedUrls],
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      variants: derivedVariants,
      updated_at: new Date().toISOString(),
    };

    const finalPayload = product 
      ? { ...payload, id: product.id } 
      : { ...payload, created_at: new Date().toISOString() };

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload)
    });
    
    const result = await res.json();
    if (result.error) {
      toast.error(`Product error: ${result.error}`);
    } else {
      toast.success(product ? 'Product updated' : 'Product created');
      onSaved();
      onClose();
    }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-t-[12px] sm:rounded-[8px] w-full sm:max-w-3xl max-h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f] flex-shrink-0">
                <h2 className="text-white font-bold text-base">
                  {product ? 'Edit Product' : 'Add Product'}
                </h2>
                <button onClick={onClose} className="p-2 text-[#444] hover:text-white rounded-[6px] hover:bg-[#1a1a1a] transition-colors">
                  <X size={17} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-1">
                    <label className="label-admin">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                      className="input-admin"
                      placeholder="Product Name"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="label-admin">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      className="input-admin font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="label-admin">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="input-admin"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-admin">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      className="input-admin"
                    >
                      <option value="All">All</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-admin">Base Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_usd}
                      onChange={(e) => setForm((f) => ({ ...f, price_usd: e.target.value }))}
                      className="input-admin"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="label-admin !mb-1">Total Product Inventory *</label>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${remainingForSizes === 0 ? 'text-green-500' : remainingForSizes < 0 ? 'text-red-500' : 'text-[#C5A021]'}`}>
                        {remainingForSizes === 0 ? 'Fully Allocated' : remainingForSizes > 0 ? `${remainingForSizes} Remaining` : `${Math.abs(remainingForSizes)} Over-allocated`}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={form.stock_quantity}
                      onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                      className="input-admin !text-xl font-black text-[#C5A021]"
                    />
                  </div>

                  <div className="flex items-center gap-6 sm:col-span-2 pt-2 pb-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-[#C5A021]' : 'bg-[#2a2a2a]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black rounded-full transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">{form.is_active ? 'Visible' : 'Hidden'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.is_featured ? 'bg-[#C5A021]' : 'bg-[#2a2a2a]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black rounded-full transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">{form.is_featured ? 'Featured' : 'Standard'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, is_trending: !f.is_trending }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.is_trending ? 'bg-[#C5A021]' : 'bg-[#2a2a2a]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black rounded-full transition-transform ${form.is_trending ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">{form.is_trending ? 'Trending' : 'Standard'}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 mt-2 p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[10px]">
                    <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[#C5A021]">1. Allocate to Sizes</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {SIZES.map((size) => {
                        const existing = hierarchicalSizes.find(s => s.size === size);
                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={!form.stock_quantity || (remainingForSizes <= 0 && !existing)}
                            onClick={() => {
                              if (existing) {
                                setHierarchicalSizes(hierarchicalSizes.filter(s => s.size !== size));
                                if (activeSizeTab === size) setActiveSizeTab(null);
                              } else {
                                setHierarchicalSizes([...hierarchicalSizes, { size, quantity: 0, colors: [] }]);
                                setActiveSizeTab(size);
                              }
                            }}
                            className={`px-4 py-2 text-xs font-black rounded-[6px] border transition-all disabled:opacity-20 ${
                              existing ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-[#111] border-[#1f1f1f] text-[#444] hover:text-white'
                            }`}
                          >
                            {size} {existing && existing.quantity > 0 && `(${existing.quantity})`}
                          </button>
                        );
                      })}
                    </div>

                    {hierarchicalSizes.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-[#1a1a1a]">
                          {hierarchicalSizes.map((s) => (
                            <button
                              key={s.size}
                              onClick={() => setActiveSizeTab(s.size)}
                              className={`flex-shrink-0 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-t-[6px] transition-all ${
                                activeSizeTab === s.size ? 'bg-[#1a1a1a] text-[#C5A021] border-x border-t border-[#1a1a1a]' : 'text-[#444] hover:text-white'
                              }`}
                            >
                              {s.size}
                            </button>
                          ))}
                        </div>

                        {activeSizeTab && (
                          <motion.div key={activeSizeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pt-2">
                            <div>
                              <label className="label-admin">Total for {activeSizeTab}</label>
                              <input
                                type="number"
                                value={hierarchicalSizes.find(s => s.size === activeSizeTab)?.quantity || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setHierarchicalSizes(hierarchicalSizes.map(s => s.size === activeSizeTab ? { ...s, quantity: val } : s));
                                }}
                                className="input-admin"
                                placeholder="Qty"
                              />
                            </div>

                            <div className="bg-[#111] p-4 rounded-[8px] border border-[#1a1a1a]">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-white text-[10px] font-black uppercase tracking-widest">2. Allocate {activeSizeTab} Colours</h4>
                                <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">
                                  {(() => {
                                    const sizeData = hierarchicalSizes.find(s => s.size === activeSizeTab);
                                    const allocated = sizeData?.colors.reduce((sum, c) => sum + c.quantity, 0) || 0;
                                    const rem = (sizeData?.quantity || 0) - allocated;
                                    return rem === 0 ? 'Allocated' : rem > 0 ? `${rem} left` : `${Math.abs(rem)} over`;
                                  })()}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mb-4">
                                <input id={`color-name-${activeSizeTab}`} placeholder="Color" className="input-admin !py-2 text-xs" />
                                <input id={`color-qty-${activeSizeTab}`} type="number" placeholder="Qty" className="input-admin !py-2 text-xs" />
                                <button 
                                  onClick={() => {
                                    const nameEl = document.getElementById(`color-name-${activeSizeTab}`) as HTMLInputElement;
                                    const qtyEl = document.getElementById(`color-qty-${activeSizeTab}`) as HTMLInputElement;
                                    if (!nameEl.value || !qtyEl.value) return;
                                    setHierarchicalSizes(hierarchicalSizes.map(s => {
                                      if (s.size === activeSizeTab) return { ...s, colors: [...s.colors, { color: nameEl.value, quantity: parseInt(qtyEl.value) }] };
                                      return s;
                                    }));
                                    nameEl.value = ''; qtyEl.value = '';
                                  }}
                                  className="bg-white text-black text-[9px] font-black uppercase rounded-[4px]"
                                >
                                  Add
                                </button>
                              </div>

                              <div className="space-y-2">
                                {hierarchicalSizes.find(s => s.size === activeSizeTab)?.colors.map((c, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[4px]">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">{c.color}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-[#C5A021]">{c.quantity} QTY</span>
                                      <button onClick={() => {
                                        setHierarchicalSizes(hierarchicalSizes.map(s => {
                                          if (s.size === activeSizeTab) return { ...s, colors: s.colors.filter((_, i) => i !== idx) };
                                          return s;
                                        }));
                                      }} className="text-red-500/40 hover:text-red-500"><X size={12} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-admin">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="input-admin h-24 resize-none text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-admin">Media Assets</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
                      className="input-admin cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-[#C5A021] file:text-black hover:file:bg-[#A6861C]"
                    />
                    <div className="flex gap-2 mt-3 flex-wrap pt-2">
                      {form.images.map((img, i) => (
                        <div key={`existing-${i}`} className="relative group">
                          <img src={img} className="h-24 w-24 object-cover rounded-[8px] border border-[#1f1f1f]" />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {files.map((f, i) => (
                        <div key={`new-${i}`} className="relative group">
                          <img src={URL.createObjectURL(f)} className="h-24 w-24 object-cover rounded-[8px] border border-[#1f1f1f]" />
                          <button
                            type="button"
                            onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#1f1f1f] flex items-center justify-between gap-3 flex-shrink-0">
                <div className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">
                  {derivedVariants.length} Combinations Defined
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#555] hover:text-white rounded-[6px]">Discard</button>
                  <button
                    onClick={handleSave}
                    disabled={saving || remainingForSizes !== 0}
                    className="px-8 py-2.5 bg-[#C5A021] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-[6px] hover:bg-[#A6861C] disabled:opacity-30 transition-all"
                  >
                    {saving && <Loader2 size={12} className="animate-spin mr-2" />}
                    {product ? 'Sync Changes' : 'Launch Product'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <style jsx global>{`
            .label-admin { display: block; color: #444; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px; }
            .input-admin { width: 100%; background: #111; border: 1px solid #1f1f1f; border-radius: 8px; padding: 12px 16px; color: white; font-size: 13px; font-weight: 500; outline: none; }
            .input-admin:focus { border-color: #C5A021; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
