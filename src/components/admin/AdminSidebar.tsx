'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Shirt,
  Box,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  FileText,
  X,
} from 'lucide-react';
import { useAdmin } from '@/store/admin';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const OWNER_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: Receipt, label: 'Orders' },
  { href: '/admin/products', icon: Shirt, label: 'Products' },
  { href: '/admin/inventory', icon: Box, label: 'Inventory' },
  { href: '/admin/staff', icon: Users, label: 'Staff' },
  { href: '/admin/shifts', icon: FileText, label: 'Shift Reports' },
  { href: '/admin/logs', icon: FileText, label: 'Audit Logs' },
  // { href: '/admin/ai', icon: Sparkles, label: 'AI Assistant' },
  { href: '/admin/settings/profile', icon: Settings, label: 'My Profile' },
  { href: '/admin/settings', icon: Settings, label: 'Store Settings' },
];

const MANAGER_ITEMS = [
  { href: '/admin/manager', icon: LayoutDashboard, label: 'My Store Dashboard' },
  { href: '/admin/orders', icon: Receipt, label: 'My Store Orders' },
  { href: '/admin/inventory', icon: Box, label: 'My Store Inventory' },
  { href: '/admin/staff', icon: Users, label: 'My Store Staff' },
  { href: '/admin/shifts', icon: FileText, label: 'My Store Shifts' },
  // { href: '/admin/ai', icon: Sparkles, label: 'AI Assistant' },
  { href: '/admin/settings/profile', icon: Settings, label: 'My Profile' },
];

export function AdminSidebar() {
  const { isCollapsed, toggleCollapsed, profile, isMobileMenuOpen, setMobileMenuOpen } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/admin/login');
    router.refresh();
  };

  const allItems = profile?.role === 'manager' ? MANAGER_ITEMS : OWNER_ITEMS;

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1f1f1f] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#1f1f1f]">
            <img src="/images/logo.jpg" alt="On Active" className="w-full h-full object-cover" />
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-white font-bold text-sm whitespace-nowrap tracking-tight"
              >
                Admin Hub
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {isMobile && (
          <button onClick={() => setMobileMenuOpen(false)} className="text-[#aaa] hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {allItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              style={{ marginLeft: isActive && !isMobile ? '-2px' : '0' }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-all duration-150 group relative ${
                isActive
                  ? 'bg-[#C5A021]/10 text-[#C5A021] border-l-2 border-[#C5A021]'
                  : 'text-[#555] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip when collapsed */}
              {isCollapsed && !isMobile && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#1f1f1f] p-2 space-y-0.5 flex-shrink-0">
        {/* User */}
        <div
          className={`flex items-center gap-3 px-3 py-2 ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
        >
          <div className="w-7 h-7 bg-[#C5A021]/10 border border-[#C5A021]/20 rounded-[4px] flex items-center justify-center flex-shrink-0">
            <span className="text-[#C5A021] text-xs font-black">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-xs font-semibold truncate">
                  {profile?.full_name ?? 'Admin'}
                </p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] ${
                    profile?.role === 'owner'
                      ? 'bg-[#C5A021]/15 text-[#C5A021]'
                      : 'bg-[#1f1f1f] text-[#555]'
                  }`}
                >
                  {profile?.role ?? 'admin'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-[#555] hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 ${
            (isCollapsed && !isMobile) ? 'justify-center' : ''
          }`}
        >
          <LogOut size={15} className="flex-shrink-0" />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center py-2 text-[#333] hover:text-[#666] transition-colors rounded-[6px] hover:bg-[#161616]"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-full bg-[#0d0d0d] border-r border-[#1f1f1f] flex-shrink-0 overflow-hidden"
      >
        <SidebarContent isMobile={false} />
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] z-[70] flex flex-col overflow-hidden shadow-2xl"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
