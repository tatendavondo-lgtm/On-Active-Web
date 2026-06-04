'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please request a new link.');
        router.push('/admin/login');
      } else {
        setValidatingSession(false);
      }
    }
    checkSession();
  }, [router, supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('Password updated successfully!');
      
      // Determine where to send the user based on their role
      const res = await fetch('/api/admin/verify-role');
      const { role } = await res.json();
      
      if (role === 'manager') {
        router.push('/admin/manager');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-[#C5A021]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-[8px] p-8">
          <h1 className="text-white text-xl font-bold mb-1 tracking-tight">Set New Password</h1>
          <p className="text-[#444] text-sm mb-8">Please enter a new, secure password for your account.</p>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                Confirm Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] px-4 py-3 text-white text-sm outline-none focus:border-[#C5A021]/50 transition-colors placeholder:text-[#333]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#C5A021] hover:bg-[#A6861C] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm py-3 rounded-[6px] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
