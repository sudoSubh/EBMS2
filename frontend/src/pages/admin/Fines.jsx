import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, Banknote, TrendingDown, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminFines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchFines = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit, ...(statusFilter && { status: statusFilter }) });
      const res = await api.get(`/fines?${params}`);
      setFines(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load fines'); }
    finally { setLoading(false); }
  }, [statusFilter, pagination.limit]);

  useEffect(() => { fetchFines(1); }, [statusFilter]);

  const openPayModal = (fine) => {
    setSelectedFine(fine);
    setPayForm({ amount: (fine.totalAmount - fine.paidAmount).toFixed(2), method: 'cash', reference: '' });
    setShowPayModal(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/fines/${selectedFine._id}/pay`, payForm);
      toast.success('Payment recorded!');
      setShowPayModal(false);
      fetchFines(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally { setSubmitting(false); }
  };

  const handleWaive = async (fine) => {
    const reason = prompt('Reason for waiving this fine:');
    if (!reason) return;
    try {
      await api.post(`/fines/${fine._id}/waive`, { reason });
      toast.success('Fine waived');
      fetchFines(pagination.page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const statusColors = {
    '': 'bg-primary-600 shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    pending: 'bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    partial: 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    paid: 'bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    waived: 'bg-slate-600 shadow-[0_0_20px_rgba(100,116,139,0.3)]',
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
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30"
          >
            <Banknote className="w-5 h-5 text-amber-400" />
          </motion.div>
          Fine Management
        </h1>
        <p className="page-subtitle">Track and collect overdue fines</p>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="admin-card flex gap-3 items-center"
      >
        <span className="text-slate-400 text-sm font-medium">Status:</span>
        {['', 'pending', 'partial', 'paid', 'waived'].map(s => (
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
        <span className="ml-auto text-xs text-slate-500 font-mono">{pagination.total} records</span>
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton rows={8} cols={7} /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card p-0">
          <table className="table">
            <thead>
              <tr>
                <th>User</th><th>Book</th><th>Overdue Days</th><th>Total Fine</th><th>Paid</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fines.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-600/30" />
                    <span>No fines found — all clear!</span>
                  </motion.div>
                </td></tr>
              ) : fines.map((fine, i) => (
                <motion.tr key={fine._id} custom={i} variants={rowVariants} initial="hidden" animate="visible">
                  <td>
                    <p className="font-medium text-white">{fine.user?.name}</p>
                    <p className="text-xs text-slate-500">{fine.user?.email}</p>
                  </td>
                  <td className="text-slate-300 text-sm">{fine.book?.title?.slice(0, 25) || '—'}...</td>
                  <td>
                    <motion.span
                      animate={fine.overdueDays > 10 ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-red-400 font-bold inline-flex items-center gap-1"
                    >
                      {fine.overdueDays > 10 && <AlertTriangle className="w-3 h-3" />}
                      {fine.overdueDays} days
                    </motion.span>
                  </td>
                  <td className="font-bold text-white">{formatCurrency(fine.totalAmount)}</td>
                  <td className="text-emerald-400 font-medium">{formatCurrency(fine.paidAmount)}</td>
                  <td><StatusBadge status={fine.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      {(fine.status === 'pending' || fine.status === 'partial') && (
                        <>
                          <motion.button
                            onClick={() => openPayModal(fine)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Record Payment"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleWaive(fine)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Waive Fine"
                          >
                            <XCircle className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-surface-700">
            <Pagination {...pagination} onPageChange={fetchFines} />
          </div>
        </motion.div>
      )}

      {/* Pay Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Fine Payment" size="sm">
        {selectedFine && (
          <form onSubmit={handlePay} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="admin-card bg-gradient-to-br from-surface-700 to-surface-800 text-center"
            >
              <p className="text-slate-400 text-sm">Remaining Balance</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-3xl font-black text-white mt-1"
              >
                {formatCurrency(selectedFine.totalAmount - selectedFine.paidAmount)}
              </motion.p>
            </motion.div>
            <Input label="Amount *" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
            <div>
              <label className="label">Payment Method</label>
              <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} className="input-field">
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
            <Input label="Reference / Receipt No." value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowPayModal(false)}>Cancel</Button>
              <Button type="submit" variant="success" isLoading={submitting}>Record Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
