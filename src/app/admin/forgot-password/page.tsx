'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      // Ensure we redirect to the local origin callback for the reset
      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      
      setSubmitted(true);
      toast.success('Password reset link sent to your email.');
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again.');
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
        <button
          onClick={() => router.push('/admin/login')}
          className="flex items-center gap-2 text-[#444] hover:text-white transition-colors mb-6 text-sm font-semibold uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        {/* Card */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-[8px] p-8">
          <h1 className="text-white text-xl font-bold mb-1 tracking-tight">Reset Password</h1>
          
          {submitted ? (
            <div className="mt-6">
              <p className="text-[#C5A021] text-sm mb-4 font-semibold">
                If an account exists for {email}, a password reset link has been sent.
              </p>
              <p className="text-[#555] text-xs">
                Please check your inbox and spam folder.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[#444] text-sm mb-8">Enter your email to receive a secure reset link.</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-[#555] text-xs font-semibold uppercase tracking-wider block mb-2">
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] px-4 py-3 text-white text-sm outline-none focus:border-[#C5A021]/50 transition-colors placeholder:text-[#333]"
                    placeholder="admin@onactive.co.zw"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-white hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm py-3 rounded-[6px] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
