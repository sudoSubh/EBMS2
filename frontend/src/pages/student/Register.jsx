import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
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

export default function StudentRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', department: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/register', { ...form, role: 'student' });
      toast.success('Registration successful! Please login.');
      navigate('/student/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
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
          className="hidden lg:flex bg-gradient-to-br from-emerald-900/80 via-teal-900/80 to-slate-900 p-12 flex-col justify-between border-r border-slate-800 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-teal-600/10 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />

          <motion.div variants={itemVariants} className="flex items-center gap-3 relative z-10">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(16,185,129,0.2)] p-1 overflow-hidden"
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
              className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <UserPlus className="w-8 h-8 text-emerald-400" />
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-3xl font-black text-white mb-4 tracking-tight">
              Join the Library
            </motion.h2>

            <motion.p variants={itemVariants} className="text-slate-400 text-sm leading-relaxed mb-8">
              Create a student account to borrow books, reserve digital copies, and track your history.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              {['Access 10k+ Books', 'Digital Reservations', 'No Late Fee Surprises'].map((f) => (
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
          className="p-8 lg:p-12 flex flex-col justify-center bg-slate-950/40 relative h-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">Create Account</h3>
          <p className="text-slate-400 mb-6 text-sm">Fill in your details to register</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div animate={focusedField === 'name' ? { scale: 1.01 } : { scale: 1 }}>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </motion.div>

            <motion.div animate={focusedField === 'email' ? { scale: 1.01 } : { scale: 1 }}>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div animate={focusedField === 'phone' ? { scale: 1.01 } : { scale: 1 }}>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-emerald-500"
                />
              </motion.div>
              <motion.div animate={focusedField === 'department' ? { scale: 1.01 } : { scale: 1 }}>
                <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  onFocus={() => setFocusedField('department')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-emerald-500"
                />
              </motion.div>
            </div>

            <motion.div animate={focusedField === 'password' ? { scale: 1.01 } : { scale: 1 }}>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-2.5 pr-12 rounded-2xl border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:border-emerald-500"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Registering...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-slate-500 text-sm">
            Already have an account?{' '}
            <Link to="/student/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              Sign In →
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
