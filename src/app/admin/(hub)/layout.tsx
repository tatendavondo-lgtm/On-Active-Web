'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { NotificationSystem } from '@/components/admin/NotificationSystem';
import { motion } from 'framer-motion';
import type { Profile } from '@/types';
import { useAdmin } from '@/store/admin';
import { useEffect } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/inventory': 'Inventory',
  '/admin/staff': 'Staff',
  '/admin/ai': 'AI Assistant',
  '/admin/settings': 'Settings',
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
    setProfile(profile);
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
            className="mx-auto max-w-[1400px] p-8 pb-28 lg:pb-8"
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
  // Profile is fetched client-side via AdminProvider; middleware guarantees auth
  return <HubShell children={children} profile={null} />;
}
