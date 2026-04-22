import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Users, RotateCcw, DollarSign,
  ShoppingCart, BarChart2, Settings, FileText, LogOut,
  ChevronLeft, Library, ChevronsUpDown, Sparkles,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const sections = [
  {
    label: 'Overview',
    items: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'Library',
    items: [
      { path: '/admin/books', icon: BookOpen, label: 'Books' },
      { path: '/admin/users', icon: Users, label: 'Users' },
      { path: '/admin/transactions', icon: RotateCcw, label: 'Circulation' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/admin/fines', icon: DollarSign, label: 'Fines' },
      { path: '/admin/procurement', icon: ShoppingCart, label: 'Procurement' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/admin/reports', icon: FileText, label: 'Reports' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col h-screen sticky top-0 bg-[#0c0c0f] border-r border-white/[0.06] select-none overflow-hidden"
      style={{ willChange: 'width' }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Library className="w-3.5 h-3.5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[13px] font-semibold text-white whitespace-nowrap"
              >
                EBMS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {sections.map(section => (
          <div key={section.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.08em] px-2 mb-1"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    title={collapsed ? label : undefined}
                    className="block"
                  >
                    <div
                      className={`flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-white/[0.08] text-white'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="truncate"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] p-2 flex-shrink-0">
        {/* User pill */}
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors cursor-default ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[12px] font-medium text-zinc-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full h-8 px-2 mt-1 rounded-md text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
