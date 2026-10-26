'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Clear any stale client-side session / localStorage on mount to prevent
    // background GoTrue token refresh errors on database reset or session expiry
    const supabase = createClient();
    supabase.auth.signOut().catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      // Verify this user has an admin profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Authentication failed'); return; }

      // Verify this user has an admin profile via server-side API (bypassing RLS)
      const res = await fetch('/api/admin/verify-role');
      const { role, error: roleError } = await res.json();

      if (roleError || !['owner', 'manager', 'admin'].includes(role?.toLowerCase())) {
        await supabase.auth.signOut();
        toast.error(`Access denied — ${roleError || 'not an admin account.'}`);
        return;
      }
      toast.success('Welcome back');
      if (role === 'manager') {
        router.push('/admin/manager');
      } else {
        router.push('/admin/dashboard');
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

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
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] flex items-center justify-center overflow-hidden border border-[#1f1f1f]">
              <img src="/images/logo.jpg" alt="On Active" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight leading-none">ON ACTIVE</p>
              <p className="text-[#444] text-[11px] font-semibold uppercase tracking-widest">Admin Hub</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-[8px] p-8">
          <h1 className="text-white text-xl font-bold mb-1 tracking-tight">Sign in</h1>
          <p className="text-[#444] text-sm mb-8">Authorised personnel only.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] px-4 py-3 text-white text-sm outline-none focus:border-[#C5A021]/50 transition-colors placeholder:text-[#333]"
                placeholder="admin@onactive.co.zw"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block">
                  Password
                </label>
                <a href="/admin/forgot-password" className="text-[#C5A021] text-xs font-semibold hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
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

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#C5A021] hover:bg-[#A6861C] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm py-3 rounded-[6px] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in to Admin Hub'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#2a2a2a] text-xs mt-6">
          On Active Admin Hub · Restricted access
        </p>
      </motion.div>
    </div>
  );
}
