import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library, Eye, EyeOff, Shield, Lock, Command, Zap } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
// Removed 3D Card components to disable hover movement
import { SparklesCore } from '../../components/ui/sparkles';
import { Globe } from '../../components/ui/globe';
import { Spotlight } from '../../components/ui/spotlight';
import { Button as MovingBorderButton } from '../../components/ui/moving-border';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      const role = result.user?.role;
      if (role === 'student') {
        toast.error('Use the Student Portal to login.');
        return;
      }
      toast.success(`Welcome back, ${result.user?.name}!`);
      navigate('/admin/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      <Spotlight className="top-20 left-80" fill="blue" />

      {/* Sparkles Effect */}
      <div className="w-full absolute inset-0 h-screen pointer-events-none">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={40}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">

        {/* Massive Floating Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 text-center pointer-events-none"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(56,189,248,0.8)]">
            EBMS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Library</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-slate-300 tracking-[0.2em] uppercase drop-shadow-md">
            E-Book Management System
          </p>
        </motion.div>

        <div className="inter-var w-full flex justify-center z-20">
          <div className="bg-[#0c0c12]/90 backdrop-blur-2xl relative group/card border border-white/10 shadow-[0_20px_80px_rgba(99,102,241,0.3)] w-auto sm:w-[500px] h-auto rounded-[2rem] p-10 flex flex-col items-center mt-[-20px]">

            <div
              className="text-xl font-bold text-neutral-600 dark:text-white"
            >
              <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.5)] mb-6 border border-white/20 p-2 overflow-hidden backdrop-blur-md">
                <img src="/outr_logo.png" alt="OUTR Logo" className="w-full h-full object-contain drop-shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Logo'; }} />
              </div>
            </div>

            <div
              className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300 text-center mb-2"
            >
              ADMIN PORTAL
            </div>

            <p
              className="text-cyan-400 font-medium text-sm max-w-sm mt-2 text-center mb-8 uppercase tracking-widest"
            >
              Secure Staff Access Only
            </p>

            <div className="w-full">
              <form onSubmit={handleSubmit} className="space-y-5 w-full flex flex-col items-center">
                <div className="w-full relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Command className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    placeholder="Admin ID or Email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                  />
                </div>

                <div className="w-full relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Security Passphrase"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="w-full mt-4 pt-4">
                  <MovingBorderButton
                    type="submit"
                    borderRadius="1rem"
                    containerClassName="w-full h-14"
                    className="bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-indigo-400" /> Login
                      </>
                    )}
                  </MovingBorderButton>
                </div>
              </form>
            </div>

            <div className="mt-8 text-center w-full border-t border-white/10 pt-6">
              <p className="text-slate-500 text-sm">
                Unauthorised access is strictly prohibited.
                <br />
                Are you a student?{' '}
                <Link to="/student/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Student Portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Globe at bottom right */}
      <div className="absolute -bottom-[20%] -right-[10%] w-[800px] h-[800px] opacity-20 pointer-events-none mix-blend-screen">
        <Globe />
      </div>
    </div>
  );
}
