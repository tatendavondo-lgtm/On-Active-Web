'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload } from 'lucide-react';
import type { Product } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, formatUSD } from '@/lib/admin/utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['Tops', 'Bottoms', 'Leggings', 'Sports Bras', 'Shorts', 'Accessories', 'Outerwear'];
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

export function ProductModal({ isOpen, product, onClose, onSaved }: ProductModalProps) {
  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: '',
    price_usd: '', sizes: [] as string[], stock_quantity: '',
    images: [] as string[], is_active: true, is_featured: false,
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState({ size: 'M', color: '', price: '', stock: '' });
  
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        category: product.category ?? '',
        price_usd: String(product.price_usd),
        sizes: product.sizes ?? [],
        stock_quantity: String(product.stock_quantity),
        images: product.images ?? [],
        is_active: product.is_active,
        is_featured: product.is_featured ?? false,
      });
      
      // Load variants if they exist
      const fetchVariants = async () => {
        const supabase = createClient();
        const { data: vars } = await supabase
          .from('product_variants')
          .select('*, store_inventory(quantity)')
          .eq('product_id', product.id);
        
        if (vars) {
          setVariants(vars.map(v => ({
            id: v.id,
            size: v.size || '',
            color: v.color || '',
            price: v.price || product.price_usd,
            stock: v.store_inventory?.[0]?.quantity || 0
          })));
        }
      };
      fetchVariants();
      setFiles([]);
    } else if (!product && isOpen) {
      setForm({ name: '', slug: '', description: '', category: '', price_usd: '', sizes: [], stock_quantity: '', images: [], is_active: true, is_featured: false });
      setVariants([]);
      setFiles([]);
    }
  }, [product, isOpen]);

  const addVariant = () => {
    if (!newVariant.color) {
      toast.error('Color is required for variants');
      return;
    }
    const v: Variant = {
      size: newVariant.size,
      color: newVariant.color,
      price: parseFloat(newVariant.price) || parseFloat(form.price_usd) || 0,
      stock: parseInt(newVariant.stock) || 0
    };
    setVariants([...variants, v]);
    setNewVariant({ ...newVariant, color: '', stock: '' });
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name || !form.price_usd) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) throw new Error(uploadData.error || 'Upload failed');
        uploadedUrls.push(uploadData.url);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
        setSaving(false);
        return;
      }
    }

    // Combine sizes from variants
    const allSizes = Array.from(new Set(variants.map(v => v.size)));

    const payload = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description || null,
      category: form.category || null,
      price_usd: parseFloat(form.price_usd),
      sizes: allSizes.length > 0 ? allSizes : form.sizes,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      images: [...form.images, ...uploadedUrls],
      is_active: form.is_active,
      is_featured: form.is_featured,
      variants: variants, // Send variants to API
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
    setSaving(false);
  };

  const toggleSize = (size: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));
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
              className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-t-[12px] sm:rounded-[8px] w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f] flex-shrink-0">
                <h2 className="text-white font-bold text-base">
                  {product ? 'Edit Product' : 'Add Product'}
                </h2>
                <button onClick={onClose} className="p-2 text-[#444] hover:text-white rounded-[6px] hover:bg-[#1a1a1a] transition-colors">
                  <X size={17} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="label-admin">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                      className="input-admin"
                      placeholder="Black Performance Leggings"
                    />
                  </div>
                  {/* Slug */}
                  <div>
                    <label className="label-admin">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      className="input-admin font-mono"
                      placeholder="black-performance-leggings"
                    />
                  </div>
                  {/* Category */}
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
                  {/* Price */}
                  <div>
                    <label className="label-admin">Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_usd}
                      onChange={(e) => setForm((f) => ({ ...f, price_usd: e.target.value }))}
                      className="input-admin"
                      placeholder="29.99"
                    />
                  </div>
                  {/* Stock */}
                  <div>
                    <label className="label-admin">Stock Quantity</label>
                    <input
                      type="number"
                      value={form.stock_quantity}
                      onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                      className="input-admin"
                      placeholder="100"
                    />
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-[#C5A021]' : 'bg-[#2a2a2a]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black rounded-full transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-white text-sm">{form.is_active ? 'Active (visible on store)' : 'Hidden'}</span>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.is_featured ? 'bg-[#C5A021]' : 'bg-[#2a2a2a]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black rounded-full transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-white text-sm">{form.is_featured ? 'Featured (Large Display)' : 'Standard Size'}</span>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="label-admin">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="input-admin h-24 resize-none"
                      placeholder="Premium breathable fabric, ergonomic fit..."
                    />
                  </div>

                  {/* Sizes */}
                  <div className="sm:col-span-2">
                    <label className="label-admin text-[#C5A021]">Base Sizes (Quick Toggle)</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-[4px] border transition-all ${
                            form.sizes.includes(size)
                              ? 'bg-[#C5A021]/15 border-[#C5A021]/40 text-[#C5A021]'
                              : 'bg-[#111] border-[#1f1f1f] text-[#444] hover:text-white hover:border-[#2a2a2a]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Dimensional Variant Manager */}
                  <div className="sm:col-span-2 mt-4 pt-6 border-t border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-4">
                      <label className="label-admin !mb-0">Defined Variants (Color + Size)</label>
                      <span className="text-[10px] font-bold text-[#444] uppercase">Total: {variants.length}</span>
                    </div>

                    {/* Variant Add Form */}
                    <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[6px]">
                      <select 
                        value={newVariant.size} 
                        onChange={e => setNewVariant({...newVariant, size: e.target.value})}
                        className="input-admin !py-2 text-xs"
                      >
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="One Size">One Size</option>
                      </select>
                      <input 
                        placeholder="Color (e.g. Black)" 
                        value={newVariant.color}
                        onChange={e => setNewVariant({...newVariant, color: e.target.value})}
                        className="input-admin !py-2 text-xs"
                      />
                      <input 
                        type="number"
                        placeholder="Stock" 
                        value={newVariant.stock}
                        onChange={e => setNewVariant({...newVariant, stock: e.target.value})}
                        className="input-admin !py-2 text-xs"
                      />
                      <button 
                        onClick={addVariant}
                        className="bg-white text-black text-[10px] font-black uppercase rounded-[4px] hover:bg-gray-200 transition-colors"
                      >
                        Add combo
                      </button>
                    </div>

                    {/* Variant List */}
                    <div className="space-y-2">
                      {variants.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-[#111] border border-[#1a1a1a] rounded-[6px] group">
                          <div className="flex items-center gap-3">
                            <span className="bg-[#1a1a1a] text-white px-2 py-0.5 rounded text-[10px] font-bold">{v.size}</span>
                            <span className="text-white text-xs font-medium">{v.color}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[#444] text-[10px] font-mono">Stock: <span className={v.stock > 0 ? 'text-[#C5A021]' : 'text-red-500'}>{v.stock}</span></span>
                            <button onClick={() => removeVariant(i)} className="text-red-500/20 hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {variants.length === 0 && (
                        <div className="py-8 text-center border border-dashed border-[#1a1a1a] rounded-[8px]">
                          <p className="text-[#333] text-[10px] font-bold uppercase tracking-widest">No custom variants defined</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="sm:col-span-2">
                    <label className="label-admin">Product Images</label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            setFiles(Array.from(e.target.files));
                          }
                        }}
                        className="input-admin flex-1 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#C5A021] file:text-black hover:file:bg-[#A6861C] transition-colors"
                      />
                    </div>
                    
                    {files.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {files.map((f, i) => (
                           <img
                             key={i}
                             src={URL.createObjectURL(f)}
                             alt="preview"
                             className="h-24 w-24 object-cover rounded-[4px] border border-[#1f1f1f]"
                           />
                        ))}
                      </div>
                    )}
                    
                    {files.length === 0 && form.images[0] && (
                      <img
                        src={form.images[0]}
                        alt="preview"
                        className="mt-3 h-24 w-24 object-cover rounded-[4px] border border-[#1f1f1f]"
                      />
                    )}

                    {/* Live preview */}
                    {(form.name || form.price_usd) && (
                      <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px]">
                        <p className="text-[#444] text-[11px] uppercase tracking-widest mb-3">Preview</p>
                        <div className="flex items-center gap-4">
                          {files.length > 0 ? (
                            <img src={URL.createObjectURL(files[0])} alt="" className="w-16 h-16 object-cover rounded-[4px]" />
                          ) : form.images[0] ? (
                            <img src={form.images[0]} alt="" className="w-16 h-16 object-cover rounded-[4px]" />
                          ) : (
                            <div className="w-16 h-16 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center">
                              <Upload size={18} className="text-[#333]" />
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-bold">{form.name || 'Product Name'}</p>
                            <p className="text-[#555] text-xs">{form.category || 'Category'}</p>
                            <p className="text-[#C5A021] text-sm font-bold mt-1">
                              {form.price_usd ? formatUSD(parseFloat(form.price_usd)) : '$0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#1f1f1f] flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-[#555] hover:text-white hover:bg-[#1a1a1a] rounded-[6px] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-[#C5A021] text-black text-sm font-bold rounded-[6px] hover:bg-[#A6861C] disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {product ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </motion.div>
          </div>

          <style jsx global>{`
            .label-admin {
              display: block;
              color: #555;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin-bottom: 6px;
            }
            .input-admin {
              width: 100%;
              background: #111;
              border: 1px solid #1f1f1f;
              border-radius: 6px;
              padding: 10px 14px;
              color: white;
              font-size: 14px;
              outline: none;
              transition: border-color 0.15s;
            }
            .input-admin:focus {
              border-color: #2a2a2a;
            }
            .input-admin option {
              background: #111;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
