import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PosCustomer } from '../db/dexie';
import { useSessionStore } from '../stores/sessionStore';
import { Button } from '../components/shared/Button';
import { Badge } from '../components/shared/Badge';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { generateUUID } from '../lib/uuid';

export default function Customers() {
  const { store } = useSessionStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const customers = useLiveQuery(
    () => {
      let query = db.customers;
      if (search) {
        return query
          .filter(c => 
            (c.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
            (c.phone || '').includes(search) || 
            (c.email || '').toLowerCase().includes(search.toLowerCase())
          )
          .toArray();
      }
      return query.toArray();
    },
    [search]
  );

  return (
    <div className="h-full flex flex-col bg-[var(--pos-bg)] overflow-hidden">
      {/* Header & Search */}
      <div className="p-8 pb-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Customer Directory</h1>
            <p className="text-[var(--pos-text-secondary)]">Manage and view your customer relationships</p>
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6">
            <Plus className="w-5 h-5" />
            Add New Customer
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-text-muted)] group-focus-within:text-[var(--pos-accent)] transition-colors" />
          <input 
            type="text"
            placeholder="Search by name, phone or email..."
            className="w-full bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] pl-12 pr-4 py-4 focus:outline-none focus:border-[var(--pos-accent)] transition-all text-lg shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4">
        {(!customers || customers.length === 0) ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--pos-text-muted)] bg-[var(--pos-surface)] rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] border-dashed">
            <User className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">No customers found</p>
            {search && <p className="text-sm opacity-60">Try a different search term</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div 
                key={customer.id} 
                className="group bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] p-6 hover:border-[var(--pos-accent)] hover:shadow-xl hover:shadow-[var(--pos-accent)]/5 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--pos-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--pos-surface-elevated)] border border-[var(--pos-border-subtle)] flex items-center justify-center text-[var(--pos-accent)]">
                    <User className="w-6 h-6" />
                  </div>
                  <button className="p-2 text-[var(--pos-text-muted)] hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[var(--pos-accent)] transition-colors line-clamp-1">{customer.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="info" className="text-[10px] uppercase">Client</Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-[var(--pos-text-secondary)]">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 opacity-60" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 opacity-60" />
                        <span className="line-clamp-1">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 opacity-60" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[var(--pos-border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--pos-text-muted)]">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--pos-text-muted)] group-hover:translate-x-1 group-hover:text-[var(--pos-accent)] transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal Placeholder */}
      {showAddModal && (
        <AddCustomerModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          storeId={store?.id || ''}
        />
      )}
    </div>
  );
}

function AddCustomerModal({ isOpen, onClose, storeId: _storeId }: { isOpen: boolean; onClose: () => void; storeId: string }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    const customer: PosCustomer = {
      id,
      ...formData,
      created_at: now
    };

    await db.customers.add(customer);
    await db.syncQueue.add({
      table: 'customers',
      operation: 'insert',
      data: customer,
      created_at: now,
      attempts: 0
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
      <div className="bg-[var(--pos-surface)] w-full max-w-lg rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[var(--pos-border)]">
          <h2 className="text-xl font-bold">Add New Customer</h2>
          <p className="text-sm text-[var(--pos-text-secondary)]">Enter customer details to register them in the system</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--pos-text-muted)]">Full Name *</label>
            <input 
              required
              type="text" 
              className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded px-4 py-2 focus:outline-none focus:border-[var(--pos-accent)]" 
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--pos-text-muted)]">Phone Number</label>
              <input 
                type="tel" 
                className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded px-4 py-2 focus:outline-none focus:border-[var(--pos-accent)]" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--pos-text-muted)]">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-[var(--pos-bg)] border border(--pos-border)] rounded px-4 py-2 focus:outline-none focus:border-[var(--pos-accent)]" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--pos-text-muted)]">Physical Address</label>
            <input 
              type="text" 
              className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded px-4 py-2 focus:outline-none focus:border-[var(--pos-accent)]" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--pos-text-muted)]">Internal Notes</label>
            <textarea 
              className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded px-4 py-2 focus:outline-none focus:border-[var(--pos-accent)] h-24 resize-none" 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="ghost" type="button" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" className="flex-1">Register Customer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
