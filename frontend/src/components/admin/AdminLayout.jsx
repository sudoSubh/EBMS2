import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './Sidebar';
import useAuthStore from '../../store/authStore';
import { Bell, Search, Command } from 'lucide-react';
import api from '../../lib/api';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    if (user?.role === 'student') {
      navigate('/student/home');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications?limit=1');
        setUnreadCount(res.pagination?.unreadCount || 0);
      } catch {}
    };
    if (isAuthenticated) fetchCount();
  }, [isAuthenticated]);

  if (!isAuthenticated || user?.role === 'student') return null;

  // Derive page title from path
  const pathSegment = location.pathname.split('/').pop();
  const pageTitle = pathSegment?.charAt(0).toUpperCase() + pathSegment?.slice(1);

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar — clean SaaS header */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-white/[0.06] bg-[#09090b] flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[13px]">
              <span className="text-zinc-500">Admin</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-200 font-medium">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search bar */}
            <div
              className={`flex items-center gap-2 h-8 px-3 rounded-lg border transition-all duration-200 ${
                searchFocused
                  ? 'border-indigo-500/40 bg-white/[0.04] w-64'
                  : 'border-white/[0.06] bg-white/[0.02] w-52'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent text-[13px] text-zinc-300 placeholder-zinc-600 border-none outline-none flex-1"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 h-5 text-[10px] font-medium text-zinc-600 bg-white/[0.04] border border-white/[0.08] rounded">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate('/admin/notifications')}
              className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
