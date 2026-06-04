'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useAdmin } from '@/store/admin';

export default function ProfileSettingsPage() {
  const { profile } = useAdmin();
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Update name if changed
      if (fullName && fullName !== profile?.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', profile?.id);
          
        if (profileError) throw profileError;
        
        await supabase.auth.updateUser({
          data: { full_name: fullName }
        });
      }

      // Update password if requested
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passError) throw passError;
        setNewPassword('');
        setConfirmPassword('');
      }

      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-[#888] text-sm">Manage your personal account settings and password.</p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleUpdateProfile} 
        className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-[12px] p-6 space-y-6"
      >
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1f1f1f] pb-2">
            <User size={16} className="text-[#C5A021]" /> Personal Info
          </h2>
          <div>
            <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] px-4 py-3 text-white text-sm outline-none focus:border-[#C5A021]/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
              Email <span className="text-[#333] lowercase">(Cannot be changed)</span>
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || 'Loading...'}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] text-[#555] rounded-[6px] px-4 py-3 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1f1f1f] pb-2">
            <Lock size={16} className="text-[#C5A021]" /> Change Password
          </h2>
          <p className="text-xs text-[#555]">Leave blank if you don't want to change your password.</p>
          
          <div>
            <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] px-4 py-3 pr-12 text-white text-sm outline-none focus:border-[#C5A021]/50 transition-colors placeholder:text-[#333]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
              Confirm New Password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] px-4 py-3 text-white text-sm outline-none focus:border-[#C5A021]/50 transition-colors placeholder:text-[#333]"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C5A021] hover:bg-[#A6861C] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm px-8 py-3 rounded-[6px] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
