'use client';

import { useState } from 'react';
import { Loader2, Trash2, UserPlus, Users, Store, Shield, Wallet, Briefcase, UserCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { formatDate } from '@/lib/admin/utils';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  full_name: string;
  role: string;
  pin: string;
  store_id: string;
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
  { id: 'security_guard', label: 'Security Guard', icon: Shield },
];

export function EmployeeManagement({ initialEmployees, stores }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [form, setForm] = useState({
    fullName: '',
    role: 'salesman',
    pin: '',
    storeId: stores[0]?.id || '',
  });
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);

  const handleAdd = async () => {
    if (!form.fullName.trim() || !form.pin.trim() || !form.storeId) {
      toast.error('All fields are required');
      return;
    }

    if (form.pin.length !== 4 || isNaN(Number(form.pin))) {
      toast.error('PIN must be a 4-digit number');
      return;
    }

    setAdding(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('employees')
        .insert({
          full_name: form.fullName,
          role: form.role,
          pin: form.pin,
          pin_hash: form.pin, // Assuming pin_hash is used as a plain pin for now based on project state
          store_id: form.storeId,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`${form.fullName} added to POS staff`);
      setEmployees((prev) => [data, ...prev]);
      setForm({
        fullName: '',
        role: 'salesman',
        pin: '',
        storeId: stores[0]?.id || '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) toast.error('Failed to remove staff member');
    else {
      toast.success('Staff member removed');
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setRemoveTarget(null);
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
        <div className="flex items-center gap-2 mb-1">
          <Store size={16} className="text-[#C5A021]" />
          <h3 className="text-white font-bold text-sm">POS Staff Management</h3>
        </div>
        <p className="text-[#444] text-xs mb-6">
          Manage physical store staff, their roles, and POS login PINs.
        </p>

        {/* Add Employee Form */}
        <div className="space-y-4 mb-8 p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[6px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="John Doe"
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors"
              />
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">4-Digit PIN</label>
              <input
                type="text"
                maxLength={4}
                value={form.pin}
                onChange={(e) => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                placeholder="1234"
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors font-mono tracking-[0.2em]"
              />
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors"
              >
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Assign Store</label>
              <select
                value={form.storeId}
                onChange={(e) => setForm(f => ({ ...f, storeId: e.target.value }))}
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors"
              >
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C5A021] text-black text-sm font-bold rounded-[6px] hover:bg-[#A6861C] disabled:opacity-50 transition-colors mt-2"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Add Staff Member
          </button>
        </div>

        {/* Staff list */}
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="No staff members" description="Add your first POS employee above." />
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[6px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center text-[#C5A021]">
                    {getRoleIcon(emp.role)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{emp.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#444] text-[10px] uppercase font-bold tracking-wider">{getStoreName(emp.store_id)}</span>
                      <span className="text-[#222] text-[10px]">•</span>
                      <span className="text-[#C5A021] text-[10px] font-mono font-bold tracking-widest">PIN: {emp.pin}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] bg-[#1f1f1f] text-[#555]">
                    {ROLES.find(r => r.id === emp.role)?.label || emp.role}
                  </span>
                  <button
                    onClick={() => setRemoveTarget(emp)}
                    className="p-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-[4px] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
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
