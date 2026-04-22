import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { formatDate, getDaysOverdue } from '../../utils/helpers';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { TiltCard } from '../../components/ui/TiltCard';
import { CardSpotlight } from '../../components/ui/card-spotlight';

export default function StudentMyBooks() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: 20, ...( tab !== 'all' && { status: tab }) });
        const res = await api.get(`/transactions?${params}`);
        setTransactions(res.data || []);
      } catch { toast.error('Failed to load books'); }
      finally { setLoading(false); }
    };
    fetchTransactions();
  }, [tab]);

  const handleRenew = async (transactionId) => {
    try {
      await api.post('/transactions/renew', { transactionId });
      toast.success('Book renewed successfully!');
      setTransactions(prev => prev.map(t =>
        t._id === transactionId ? { ...t, renewalCount: t.renewalCount + 1 } : t
      ));
    } catch (err) {
      toast.error(err.message || 'Renewal failed');
    }
  };

  const tabs = [
    { id: 'active', label: 'Active Borrowings' },
    { id: 'overdue', label: '⚠ Overdue' },
    { id: 'returned', label: 'Returned History' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Your Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Library</span></h1>
        <p className="text-zinc-400 max-w-xl text-lg">Manage your currently borrowed books, check due dates, and renew your literature with a single tap.</p>
      </div>

      {/* Animated Segmented Control */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 z-10 ${tab === t.id ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <span className="relative z-10">{t.label}</span>
              {tab === t.id && (
                <motion.div
                  layoutId="mybooks-tab"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>
      ) : transactions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-[2.5rem] border border-white/10 max-w-4xl mx-auto"
        >
          <BookOpen className="w-16 h-16 mx-auto mb-6 text-zinc-600" />
          <p className="text-xl font-medium text-zinc-300 mb-2">No {tab} records found</p>
          <p className="text-zinc-500">Your {tab} list is empty. Go browse the catalog to find your next read.</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {transactions.map(t => {
              const daysLeft = Math.floor((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              const overdue = getDaysOverdue(t.dueDate);
              
              return (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <TiltCard maxTilt={4} glareColor="rgba(255,255,255,0.05)" borderGlow={true}>
                    <CardSpotlight className="h-full bg-[#0d0d12]/90 border-white/10 rounded-[2rem] p-6">
                      <div className="flex items-start gap-6">
                        {/* Book Cover */}
                        <div className="w-24 h-36 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xl border border-white/5 relative group">
                          {t.book?.coverImage ? (
                            <img src={t.book.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : <BookOpen className="w-8 h-8 text-zinc-600" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-bold text-white text-lg truncate pr-2">{t.book?.title}</h3>
                            <StatusBadge status={t.status} />
                          </div>
                          <p className="text-zinc-400 text-sm mb-4">{t.book?.author}</p>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-white/5">
                            <div>
                              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Issued On</p>
                              <p className="font-medium text-zinc-200 text-sm">{formatDate(t.issueDate)}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Due Date</p>
                              <p className={`font-medium text-sm ${overdue > 0 ? 'text-red-400' : 'text-zinc-200'}`}>{formatDate(t.dueDate)}</p>
                            </div>
                            <div className="col-span-2 flex items-center justify-between">
                              <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Renewals</p>
                                <div className="flex items-center gap-1.5">
                                  {Array.from({ length: t.maxRenewals }).map((_, i) => (
                                    <div key={i} className={`w-8 h-1.5 rounded-full ${i < t.renewalCount ? 'bg-indigo-500' : 'bg-white/10'}`} />
                                  ))}
                                  <span className="text-xs text-zinc-400 ml-1">{t.renewalCount}/{t.maxRenewals}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {overdue > 0 && t.status !== 'returned' && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                              <AlertTriangle className="w-4 h-4 animate-pulse" />
                              <span className="font-medium">{overdue} days overdue</span>
                            </div>
                          )}

                          {t.status !== 'returned' && t.renewalCount < t.maxRenewals && daysLeft >= 0 && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleRenew(t._id)}
                              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" /> Renew Book Fast
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </CardSpotlight>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
