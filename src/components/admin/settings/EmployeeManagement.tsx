'use client';

import { useState } from 'react';
import { Loader2, Trash2, UserPlus, Users, Store, Shield, Wallet, Briefcase, UserCircle, Edit2, X, Phone, Mail } from 'lucide-react';
import { addStaffMember, updateStaffMember, deactivateStaffMember } from '@/app/admin/(hub)/staff/actions';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  full_name: string;
  role: string;
  pin: string;
  store_id: string;
  email?: string;
  phone?: string;
  created_at: string;
  is_active: boolean;
}

interface Store {
  id: string;
  name: string;
}

interface EmployeeManagementProps {
  initialEmployees: any[];
  stores: Store[];
}

const ROLES = [
  { id: 'manager', label: 'Management', icon: Briefcase },
  { id: 'salesman', label: 'Salesman', icon: UserCircle },
  { id: 'till_operator', label: 'Till Operator', icon: Wallet },
  { id: 'supervisor', label: 'Supervisor', icon: Shield },
];

export function EmployeeManagement({ initialEmployees, stores }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees.filter(e => e.is_active));
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    fullName: '',
    role: 'salesman',
    pin: '',
    email: '',
    phone: '',
    storeId: stores[0]?.id || '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);



  const resetForm = () => {
    setForm({
      fullName: '',
      role: 'salesman',
      pin: '',
      email: '',
      phone: '',
      storeId: stores[0]?.id || '',
    });
    setEditingId(null);
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      fullName: emp.full_name,
      role: emp.role,
      pin: '', // Keep PIN empty unless changing
      email: emp.email || '',
      phone: emp.phone || '',
      storeId: emp.store_id,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.storeId) {
      toast.error('Name and Store are required');
      return;
    }

    if (!editingId && (!form.pin.trim() || form.pin.length < 4)) {
      toast.error('A 4-digit PIN is required for new staff');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateStaffMember(editingId, {
          ...form,
          pin: form.pin.trim() || undefined
        });
        setEmployees(prev => prev.map(e => e.id === editingId ? updated : e));
        toast.success('Staff member updated');
      } else {
        const data = await addStaffMember(form);
        setEmployees(prev => [data, ...prev]);
        toast.success(`${form.fullName} added to POS staff`);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deactivateStaffMember(id);
      toast.success('Staff member deactivated');
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setRemoveTarget(null);
    } catch (err) {
      toast.error('Failed to deactivate staff member');
    }
  };

  const getRoleIcon = (roleId: string) => {
    const role = ROLES.find(r => r.id === roleId);
    const Icon = role?.icon || UserCircle;
    return <Icon size={14} />;
  };

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || 'Unknown Store';
  };

  return (
    <>
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-[#C5A021]" />
            <h3 className="text-white font-bold text-sm">POS Staff Management</h3>
          </div>
          {editingId && (
            <button onClick={resetForm} className="text-[10px] font-bold uppercase text-red-500 flex items-center gap-1 hover:underline">
              <X size={12} /> Cancel Edit
            </button>
          )}
        </div>
        <p className="text-[#444] text-xs mb-6">
          {editingId ? `Currently editing ${form.fullName}` : 'Manage physical store staff, their roles, and POS login PINs.'}
        </p>

        {/* Form */}
        <div className={`space-y-4 mb-8 p-4 bg-[#0a0a0a] border rounded-[6px] transition-colors ${editingId ? 'border-[#C5A021]/30' : 'border-[#1a1a1a]'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="John Doe"
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
              />
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Email (Optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@onactive.co.zw"
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
              />
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Phone (Optional)</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+263 7..."
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
              />
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none"
              >
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Store</label>
              <select
                value={form.storeId}
                onChange={(e) => setForm(f => ({ ...f, storeId: e.target.value }))}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none"
              >
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                {editingId ? 'Change PIN (Leave blank to keep current)' : 'Login PIN (4-Digits)'}
              </label>
              <input
                type="text"
                maxLength={4}
                value={form.pin}
                onChange={(e) => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                placeholder={editingId ? '••••' : '1234'}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#C5A021]/50 font-mono tracking-[0.2em]"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-black text-sm font-bold rounded-[6px] transition-colors mt-2 ${editingId ? 'bg-white hover:bg-gray-200' : 'bg-[#C5A021] hover:bg-[#A6861C]'}`}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : editingId ? <Edit2 size={14} /> : <UserPlus size={14} />}
            {editingId ? 'Update Staff Member' : 'Add Staff Member'}
          </button>
        </div>

        {/* List */}
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="No staff members" description="Add your first POS employee above." />
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`group flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border rounded-[6px] transition-colors ${editingId === emp.id ? 'border-[#C5A021] bg-[#C5A021]/5' : 'border-[#1a1a1a] hover:border-[#222]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center text-[#C5A021]">
                    {getRoleIcon(emp.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{emp.full_name}</p>
                      {emp.email && <Mail size={10} className="text-[#333]" />}
                      {emp.phone && <Phone size={10} className="text-[#333]" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#444] text-[10px] uppercase font-bold tracking-wider">{getStoreName(emp.store_id)}</span>
                      <span className="text-[#222] text-[10px]">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#C5A021] text-[10px] font-mono font-bold tracking-widest">
                          PIN: ••••
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] bg-[#1f1f1f] text-[#555]">
                    {ROLES.find(r => r.id === emp.role)?.label || emp.role}
                  </span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="p-1.5 text-[#444] hover:text-white hover:bg-white/5 rounded-[4px]"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setRemoveTarget(emp)}
                      className="p-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-[4px]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!removeTarget}
        danger
        title="Remove staff member?"
        message={`${removeTarget?.full_name} will be immediately locked out of the POS system.`}
        confirmLabel="Remove"
        onConfirm={() => removeTarget && handleRemove(removeTarget.id)}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}

