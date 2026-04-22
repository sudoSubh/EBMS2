import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Home, BookMarked, DollarSign, Bell, LogOut, Library } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { TracingBeam } from '../ui/tracing-beam';

const navItems = [
  { path: '/student/home', icon: Home, label: 'Home' },
  { path: '/student/books', icon: BookOpen, label: 'Catalog' },
  { path: '/student/my-books', icon: BookMarked, label: 'My Books' },
  { path: '/student/fines', icon: DollarSign, label: 'Fines' },
  { path: '/student/notifications', icon: Bell, label: 'Alerts' },
];

export default function StudentLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/student/login');
      return;
    }
    if (user?.role !== 'student') {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/student/login');
  };

  if (!isAuthenticated || user?.role !== 'student') return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Floating Apple-style Navigation Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-4 py-2 flex items-center gap-6 saturate-150">
          
          <Link to="/student/home" className="flex items-center gap-2 group mr-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <Library className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:block font-bold text-white tracking-tight">EBMS</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <NavLink
                  key={path}
                  to={path}
                  className="relative group px-3 py-2 rounded-full transition-all duration-300"
                >
                  <div className="flex items-center gap-1.5 z-10 relative">
                    <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                    <span className={`hidden sm:block text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                      {label}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="student-nav-pill"
                      className="absolute inset-0 bg-white/10 border border-white/5 rounded-full -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5 cursor-default" title={user?.name}>
              <span className="text-sm font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 -mr-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <main className="flex-1 mt-28 px-4 sm:px-8 max-w-7xl mx-auto w-full pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
