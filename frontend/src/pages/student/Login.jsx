import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { BackgroundBeams } from '../../components/ui/background-beams';
import { FloatingShapes } from '../../components/ui/FloatingElements';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function StudentLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      const role = result.user?.role;
      if (role !== 'student') {
        toast.error('Please use the Admin Portal to login.');
        return;
      }
      toast.success(`Welcome, ${result.user?.name}!`);
      navigate('/student/home');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundBeams />
      <FloatingShapes className="opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-4xl grid lg:grid-cols-2 gap-0 bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden z-10 border border-slate-800/60"
      >
        {/* Left - Branding */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-gradient-to-br from-primary-900/80 via-violet-900/80 to-slate-900 p-12 flex flex-col justify-between border-r border-slate-800 relative overflow-hidden"
        >
          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-violet-600/10 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />

          <motion.div variants={itemVariants} className="flex items-center gap-3 relative z-10">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(99,102,241,0.2)] p-1 overflow-hidden"
            >
              <img src="/outr_logo.png" alt="OUTR Logo" className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Logo'; }} />
            </motion.div>
            <span className="font-bold text-white text-lg tracking-wide">EBMS Library</span>
          </motion.div>

          <div className="relative z-10">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-16 h-16 rounded-3xl bg-primary-500/20 flex items-center justify-center mb-6 border border-primary-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            >
              <GraduationCap className="w-8 h-8 text-primary-400" />
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-3xl font-black text-white mb-4 tracking-tight">
              Student Portal
            </motion.h2>

            <motion.p variants={itemVariants} className="text-slate-400 text-sm leading-relaxed mb-8">
              Access your library account to track borrowings, pay fines, and explore the catalog.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              {['Browse Catalog', 'Track Borrowings', 'Manage Fines'].map((f, i) => (
                <motion.div
                  key={f}
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="flex items-center gap-2 text-slate-300 text-sm font-medium"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs border border-emerald-500/30">✓</div>
                  {f}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.p variants={itemVariants} className="text-slate-500 text-xs tracking-wider relative z-10">
            © 2026 EBMS Library System
          </motion.p>
        </motion.div>

        {/* Right - Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="p-12 flex flex-col justify-center bg-slate-950/40 relative"
        >
          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">Sign In</h3>
          <p className="text-slate-400 mb-8 text-sm">Welcome back</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              animate={focusedField === 'email' ? { scale: 1.01 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="student@university.edu"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                className={`w-full px-4 py-3 rounded-2xl border bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 font-mono text-sm ${
                  focusedField === 'email' ? 'border-primary-500/50 shadow-[0_0_25px_rgba(99,102,241,0.15)]' : 'border-slate-700'
                }`}
              />
            </motion.div>

            <motion.div
              animate={focusedField === 'password' ? { scale: 1.01 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full px-4 py-3 pr-12 rounded-2xl border bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 font-mono text-sm ${
                    focusedField === 'password' ? 'border-primary-500/50 shadow-[0_0_25px_rgba(99,102,241,0.15)]' : 'border-slate-700'
                  }`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="relative group w-full py-3.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden"
            >
              {/* Shimmer sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing In...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </span>
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6 text-slate-500 text-sm flex flex-col gap-2"
          >
            <span>
              New student?{' '}
              <Link to="/student/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                Create Account
              </Link>
            </span>
            <span>
              Staff member?{' '}
              <Link to="/admin/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
                Admin Login →
              </Link>
            </span>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
