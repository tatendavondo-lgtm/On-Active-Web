'use client';

import { useState } from 'react';
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import { removeTeamMember } from '@/app/admin/(hub)/staff/actions';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { formatDate } from '@/lib/admin/utils';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

interface TeamManagementProps {
  managers: Profile[];
}

export function TeamManagement({ managers: initialManagers }: TeamManagementProps) {
  const [managers, setManagers] = useState(initialManagers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Profile | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) { 
      toast.error('Email and Name are required'); 
      return; 
    }
    setInviting(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail,
          fullName: inviteName,
          role: inviteRole
        }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? 'Failed to create manager account');
      else {
        toast.success(`Account created for ${inviteName}! Password: ${data.tempPassword}`, { duration: 10000 });
        setInviteEmail('');
        setInviteName('');
        // Reload page to fetch the newly created manager profile
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (managerId: string) => {
    try {
      await removeTeamMember(managerId);
      toast.success('Manager removed');
      setManagers((prev) => prev.filter((m) => m.id !== managerId));
      setRemoveTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove manager');
    }
  };

  return (
    <>
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
        <h3 className="text-white font-bold text-sm mb-1">Team Management</h3>
        <p className="text-[#444] text-xs mb-6">
          Invite managers to access the admin hub. They can view and manage orders, products, and inventory.
        </p>

        {/* Invite */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full Name"
              className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px] px-4 py-2.5 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors"
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="manager@onactive.co.zw"
              className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px] px-4 py-2.5 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors"
            />
          </div>
          <div className="flex gap-2.5">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px] px-4 py-2.5 text-white text-sm outline-none"
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button
              id="invite-manager-btn"
              onClick={handleInvite}
              disabled={inviting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A021] text-black text-sm font-bold rounded-[6px] hover:bg-[#A6861C] disabled:opacity-50 transition-colors"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Invite
            </button>
          </div>
        </div>

        {/* Manager list */}
        {managers.length === 0 ? (
          <EmptyState icon={Users} title="No team members yet" description="Invite managers to help run the store." />
        ) : (
          <div className="space-y-2">
            {managers.map((manager) => (
              <div
                key={manager.id}
                className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[6px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {manager.full_name?.[0]?.toUpperCase() ?? 'M'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{manager.full_name ?? '—'}</p>
                    <p className="text-[#444] text-xs">{formatDate(manager.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] ${
                      manager.role === 'owner'
                        ? 'bg-[#C5A021]/15 text-[#C5A021]'
                        : 'bg-[#1f1f1f] text-[#555]'
                    }`}
                  >
                    {manager.role}
                  </span>
                  {manager.role !== 'owner' && (
                    <button
                      onClick={() => setRemoveTarget(manager)}
                      className="p-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-[4px] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!removeTarget}
        danger
        title="Remove team member?"
        message={`${removeTarget?.full_name ?? 'This manager'} will lose access to the admin hub immediately.`}
        confirmLabel="Remove"
        onConfirm={() => removeTarget && handleRemove(removeTarget.id)}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}
