import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { formatDate } from '../../utils/helpers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { TracingBeam } from '../../components/ui/tracing-beam';

const typeConfig = {
  due_reminder: { icon: '⏰', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  overdue_alert: { icon: '🚨', color: 'text-red-400', bg: 'bg-red-500/10' },
  reservation_available: { icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  book_issued: { icon: '📚', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  book_returned: { icon: '✓', color: 'text-zinc-400', bg: 'bg-white/5' },
  fine_created: { icon: '💰', color: 'text-red-400', bg: 'bg-red-500/10' },
  fine_paid: { icon: '💚', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  general: { icon: '📢', color: 'text-violet-400', bg: 'bg-violet-500/10' },
};

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications?limit=50')
      .then(res => setNotifications(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    if (notifications.every(n => n.isRead)) return;
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('System clear');
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>;

  return (
    <TracingBeam className="px-2 sm:px-6">
      <div className="space-y-10 max-w-4xl mx-auto py-10 relative">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              System alerts <Sparkles className="w-8 h-8 text-indigo-400" />
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">Stay updated with your library events.</p>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={markAllRead} 
            disabled={notifications.every(n => n.isRead)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </motion.button>
        </div>

        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-[2.5rem] border border-white/10"
          >
            <Bell className="w-16 h-16 mx-auto mb-6 text-zinc-600" />
            <p className="text-2xl font-bold text-zinc-300 mb-2">It's quiet.</p>
            <p className="text-zinc-500">You have no new notifications right now.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n, i) => {
              const conf = typeConfig[n.type] || typeConfig.general;
              
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group relative overflow-hidden bg-white/5 backdrop-blur-sm border ${n.isRead ? 'border-white/5 opacity-60 hover:opacity-100' : 'border-indigo-500/30 bg-indigo-500/5'} rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white/10`}
                >
                  {/* Unread indicator glow */}
                  {!n.isRead && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  )}

                  <div className="flex gap-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${conf.bg} border border-white/5 shadow-inner`}>
                      {conf.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <p className={`font-bold text-lg truncate ${n.isRead ? 'text-zinc-300' : 'text-white'}`}>{n.title}</p>
                          {!n.isRead && <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase tracking-widest">New</span>}
                        </div>
                        <span className="text-zinc-500 text-xs font-mono whitespace-nowrap bg-black/20 px-3 py-1 rounded-full">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className={`${n.isRead ? 'text-zinc-500' : 'text-zinc-400'} leading-relaxed`}>{n.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </TracingBeam>
  );
}
