'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/store/admin';

interface AdminTopBarProps {
  pageTitle: string;
}

export function AdminTopBar({ pageTitle }: AdminTopBarProps) {
  const { notifications, markAllRead } = useAdmin();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [now, setNow] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const handleBellClick = () => {
    setShowNotifs((v) => !v);
    if (!showNotifs) markAllRead();
  };

  return (
    <header className="h-16 border-b border-[#1f1f1f] bg-[#0d0d0d] flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
      <h1 className="text-white font-bold text-base lg:text-lg tracking-tight">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        {/* Live clock */}
        <div className="hidden sm:flex flex-col items-end leading-none">
          <span className="text-white text-sm font-mono font-semibold">{timeStr}</span>
          <span className="text-[#444] text-[11px] mt-0.5">{dateStr}</span>
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button
            id="admin-notifications-btn"
            onClick={handleBellClick}
            className="relative p-2 text-[#444] hover:text-white transition-colors duration-150 rounded-[6px] hover:bg-[#161616]"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#C5A021] text-black text-[9px] font-black rounded-[3px] flex items-center justify-center leading-none"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-[#111] border border-[#1f1f1f] rounded-[6px] z-50 shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
                    <p className="text-white text-sm font-semibold">Notifications</p>
                    {notifications.length > 0 && (
                      <span className="text-[#444] text-xs">{notifications.length} total</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={20} className="text-[#2a2a2a] mx-auto mb-2" />
                      <p className="text-[#444] text-xs">All clear â€” no notifications yet</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 border-b border-[#181818] hover:bg-[#161616] transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                n.type === 'new_order' ? 'bg-[#C5A021]' : 'bg-amber-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold">{n.title}</p>
                              <p className="text-[#555] text-xs mt-0.5 truncate">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-[4px] flex items-center justify-center overflow-hidden border border-[#2a2a2a]">
          <img src="/images/logo.jpg" alt="On Active" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}
