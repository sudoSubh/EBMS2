import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, DollarSign, BookmarkCheck, ArrowRight, Bell, Library } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import { BackgroundGradient } from '../../components/ui/background-gradient';
import { HeroHighlight, Highlight } from '../../components/ui/hero-highlight';
import { BentoGrid, BentoGridItem } from '../../components/ui/bento-grid';
import { TracingBeam } from '../../components/ui/tracing-beam';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function StudentHome() {
  const { user } = useAuthStore();
  const [activeBooks, setActiveBooks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [fineAmount, setFineAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [transRes, fineRes, notifRes] = await Promise.all([
          api.get('/transactions?status=active&limit=3'),
          api.get('/fines?status=pending&limit=10'),
          api.get('/notifications?limit=5'),
        ]);
        setActiveBooks(transRes.data || []);
        const pending = (fineRes.data || []).reduce((sum, f) => sum + f.totalAmount - f.paidAmount, 0);
        setFineAmount(pending);
        setNotifications(notifRes.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-16 pb-20 overflow-hidden dark">
      
      {/* 3D Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.5rem] bg-[#0c0c10] border border-white/10 shadow-2xl"
      >
        <HeroHighlight containerClassName="h-[400px] sm:h-[450px] bg-transparent" className="flex flex-col items-center justify-center text-center px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <Library className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white tracking-widest uppercase">Student Portal</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white max-w-4xl leading-tight tracking-tight mb-6"
          >
            Welcome back, <br className="sm:hidden" />
            <Highlight className="text-white">
              {user?.name?.split(' ')[0]}
            </Highlight>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg text-zinc-400 max-w-2xl font-medium"
          >
            {fineAmount > 0 
              ? `You have an outstanding fine of ${formatCurrency(fineAmount)}. Please clear it to avoid limitations.`
              : 'All your accounts are clear. Discover new knowledge today.'}
          </motion.p>
        </HeroHighlight>
      </motion.div>

      <TracingBeam className="px-6 relative z-10">
        
        {/* Bento Grid Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          <BentoGrid className="max-w-full">
            <BentoGridItem
              title="Active Borrowings"
              description="Books currently in your possession"
              className="md:col-span-1 shadow-2xl transition-shadow bg-[#121217] border border-white/10 group"
              header={
                <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-indigo-500/10 group-hover:scale-[1.02] transition-transform">
                  <div className="text-5xl font-black text-indigo-400 drop-shadow-sm flex items-center gap-2">
                    {activeBooks.length} 
                    <BookOpen className="w-8 h-8 opacity-50 text-indigo-500" />
                  </div>
                </div>
              }
            />
            <BentoGridItem
              title="Financial Standing"
              description={fineAmount > 0 ? 'Immediate attention required' : 'All accounts clear'}
              className="md:col-span-1 shadow-2xl transition-shadow bg-[#121217] border border-white/10 group"
              header={
                <div className={`flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl transition-transform group-hover:scale-[1.02] ${fineAmount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  <div className={`text-5xl font-black drop-shadow-sm flex items-center gap-2 ${fineAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(fineAmount)}
                  </div>
                </div>
              }
            />
            <BentoGridItem
              title="System Alerts"
              description="Recent library notifications"
              className="md:col-span-1 shadow-2xl transition-shadow bg-[#121217] border border-white/10 group"
              header={
                <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-amber-500/10 group-hover:scale-[1.02] transition-transform">
                  <div className="text-5xl font-black text-amber-500 drop-shadow-sm flex items-center gap-2">
                    {notifications.length}
                    <Bell className="w-8 h-8 opacity-50 text-amber-500" />
                  </div>
                </div>
              }
            />
          </BentoGrid>
        </motion.div>

        {/* 3D Floating Book Cards */}
        {activeBooks.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-20"
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Current Reads</h2>
              <Link to="/student/my-books" className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-2 group">
                View all <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeBooks.map((t, i) => {
                const daysLeft = Math.floor((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <motion.div key={t._id} variants={itemVariants} className="h-full">
                    <BackgroundGradient className="rounded-[22px] bg-[#121217] border border-white/10 p-6 h-full flex flex-col justify-between">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 rounded-md overflow-hidden bg-black/50 flex-shrink-0 shadow-inner border border-white/5">
                          {t.book?.coverImage ? (
                            <img src={t.book.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg leading-tight mb-1">{t.book?.title}</h3>
                          <p className="text-sm font-medium text-zinc-400 mb-3">{t.book?.author}</p>
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400 font-medium">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Due {formatDate(t.dueDate)}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : daysLeft <= 2 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d Overdue` : daysLeft === 0 ? 'Due Today' : `${daysLeft}d Left`}
                        </span>
                      </div>
                    </BackgroundGradient>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Notifications list with hover cards */}
        {notifications.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-20"
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Recent Activity</h2>
              <Link to="/student/notifications" className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-2 group">
                All alerts <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
            
            <div className="grid gap-3">
              {notifications.slice(0, 4).map((n, i) => (
                <motion.div
                  key={n._id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-4 transition-colors cursor-pointer hover:bg-white/10 shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-white/5 text-zinc-500' : 'bg-indigo-500/20 test-indigo-400 border border-indigo-500/50'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                      <h4 className={`text-base font-bold truncate ${n.isRead ? 'text-zinc-400' : 'text-white'}`}>{n.title}</h4>
                      <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className={`text-sm line-clamp-2 ${n.isRead ? 'text-zinc-500' : 'text-zinc-300 font-medium'}`}>{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] flex-shrink-0 mt-1 sm:mt-0" 
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </TracingBeam>
    </div>
  );
}
