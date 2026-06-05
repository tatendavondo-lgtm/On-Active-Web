'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { NotificationSystem } from '@/components/admin/NotificationSystem';
import { motion } from 'framer-motion';
import type { Profile } from '@/types';
import { useAdmin } from '@/store/admin';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/inventory': 'Inventory',
  '/admin/staff': 'Staff',
  '/admin/ai': 'AI Assistant',
  '/admin/settings': 'Settings',
  '/admin/logs': 'Audit Logs',
  '/admin/manager': 'Manager Dashboard',
};

function HubShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile | null;
}) {
  const pathname = usePathname();
  const pageTitle =
    Object.entries(PAGE_TITLES).find(([key]) => pathname?.startsWith(key))?.[1] ?? 'Admin';

  const setProfile = useAdmin((state) => state.setProfile);

  useEffect(() => {
    if (profile) {
      setProfile(profile);
    }
  }, [profile, setProfile]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AdminTopBar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
      <NotificationSystem />
    </div>
  );
}

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/admin/verify-role');
        if (!res.ok) {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }
        const profileData = await res.json();
        if (profileData) {
          setProfileState(profileData as Profile);
        } else {
          router.push('/admin/login');
        }
      } catch (err) {
        console.error('Failed to load admin profile client-side:', err);
        router.push('/admin/login');
      }
    }
    loadProfile();
  }, [router]);

  return <HubShell children={children} profile={profile} />;
}
