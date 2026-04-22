import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CardSpotlight } from '../../components/ui/card-spotlight';
import { TiltCard } from '../../components/ui/TiltCard';

export default function StudentFines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    api.get('/fines?limit=50')
      .then(res => {
        const f = res.data || [];
        setFines(f);
        const pending = f.filter(x => x.status !== 'paid' && x.status !== 'waived').reduce((sum, x) => sum + x.totalAmount - x.paidAmount, 0);
        setTotalPending(pending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-4">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">Overview</span></h1>
        <p className="text-zinc-400 max-w-xl text-lg">Keep track of your pending library dues and payment history.</p>
      </div>

      <AnimatePresence>
        {totalPending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative"
          >
            {/* Glowing warning aura */}
            <div className="absolute -inset-1 rounded-3xl bg-red-500/20 blur-2xl z-0" />
            
            <div className="relative z-10 bg-[#120a0a] border border-red-500/30 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-red-400 uppercase tracking-widest text-sm mb-1">Total Outstanding Balance</p>
                  <p className="text-5xl md:text-6xl font-black text-white tracking-tighter">{formatCurrency(totalPending)}</p>
                  <p className="text-zinc-400 mt-2">Please visit the library front desk to clear your dues.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fines.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-[2.5rem] border border-white/10 mt-12"
        >
          <motion.div 
            animate={{ rotateY: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            <ShieldCheck className="w-12 h-12 text-emerald-400" />
          </motion.div>
          <p className="text-2xl font-bold text-emerald-400 mb-2">You're all clear!</p>
          <p className="text-zinc-500 text-lg">You have absolutely no fines or pending payments.</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-white mb-6 pt-8 border-t border-white/10">Fine History</h2>
          {fines.map((fine, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={fine._id}
            >
              <TiltCard maxTilt={2} borderGlow={false} scale={1.01}>
                <CardSpotlight className="bg-[#0f0f13] border-white/5 p-6 rounded-3xl w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${fine.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{fine.book?.title || 'System Fine'}</h3>
                        <p className="text-zinc-500 text-sm mt-1">Generated on {formatDate(fine.createdAt)} • {fine.overdueDays} days late</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 px-6 py-4 rounded-2xl flex-wrap">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="font-bold text-white font-mono">{formatCurrency(fine.totalAmount)}</p>
                      </div>
                      <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Paid Amount</p>
                        <p className="font-bold text-emerald-400 font-mono">{formatCurrency(fine.paidAmount)}</p>
                      </div>
                      <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
                      <div className="flex flex-col items-end min-w-[80px]">
                        <StatusBadge status={fine.status} />
                      </div>
                    </div>

                  </div>
                </CardSpotlight>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
