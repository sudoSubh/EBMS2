import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookmarkCheck, XCircle } from 'lucide-react';
import api from '../../lib/api';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchReservations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit, ...(statusFilter && { status: statusFilter }) });
      const res = await api.get(`/reservations?${params}`);
      setReservations(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load reservations'); }
    finally { setLoading(false); }
  }, [statusFilter, pagination.limit]);

  useEffect(() => { fetchReservations(1); }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchReservations(pagination.page);
    } catch (err) { toast.error(err.message); }
  };

  const statusColors = {
    '': 'bg-primary-600 shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    pending: 'bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    fulfilled: 'bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    cancelled: 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    expired: 'bg-slate-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30"
          >
            <BookmarkCheck className="w-5 h-5 text-blue-400" />
          </motion.div>
          Reservations
        </h1>
        <p className="page-subtitle">Manage book reservation queue</p>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="admin-card flex gap-3 items-center"
      >
        <span className="text-slate-400 text-sm font-medium">Status:</span>
        {['', 'pending', 'fulfilled', 'cancelled', 'expired'].map(s => (
          <motion.button
            key={s}
            onClick={() => setStatusFilter(s)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${statusFilter === s ? `${statusColors[s]} text-white` : 'text-slate-400 hover:text-white hover:bg-surface-700'}`}
          >
            {s || 'All'}
          </motion.button>
        ))}
        <span className="ml-auto text-xs text-slate-500 font-mono">{pagination.total} reservations</span>
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton rows={8} cols={6} /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card p-0">
          <table className="table">
            <thead>
              <tr>
                <th>User</th><th>Book</th><th>Queue Position</th><th>Reserved At</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                    <BookmarkCheck className="w-8 h-8 text-slate-600/30" />
                    <span>No reservations found</span>
                  </motion.div>
                </td></tr>
              ) : reservations.map((r, i) => (
                <motion.tr key={r._id} custom={i} variants={rowVariants} initial="hidden" animate="visible">
                  <td>
                    <p className="font-medium text-white">{r.user?.name}</p>
                    <p className="text-xs text-slate-500">{r.user?.email}</p>
                  </td>
                  <td className="text-slate-300">{r.book?.title?.slice(0, 30)}...</td>
                  <td>
                    <motion.span
                      whileHover={{ scale: 1.2 }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary-500/15 border border-primary-500/30 text-primary-400 font-black text-sm"
                    >
                      {r.queuePosition}
                    </motion.span>
                  </td>
                  <td className="text-slate-400 text-sm">{formatDate(r.reservedAt)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === 'pending' && (
                      <motion.button
                        onClick={() => handleCancel(r._id)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </motion.button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-surface-700">
            <Pagination {...pagination} onPageChange={fetchReservations} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
