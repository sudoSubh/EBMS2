import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ArrowRightLeft, RotateCcw, AlertTriangle,
  Search, User, CheckCircle, X, Plus, Zap,
} from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { formatDate, getDaysOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';

/* ── Searchable Dropdown ─────────────────────────────────── */
function SearchSelect({ label, placeholder, onSearch, renderItem, onSelect, selected, renderSelected }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await onSearch(query);
      setResults(r);
      setOpen(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref}>
      <label className="label">{label}</label>
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3"
          >
            <div>{renderSelected(selected)}</div>
            <motion.button
              type="button"
              onClick={() => onSelect(null)}
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="input-field pl-9"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500/40 border-t-primary-500 rounded-full animate-spin" />
            )}
            <AnimatePresence>
              {open && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface-800 border border-surface-600 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden max-h-56 overflow-y-auto"
                >
                  {results.map((item, i) => (
                    <motion.button
                      key={item._id}
                      type="button"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-700 transition-all duration-200 border-b border-surface-700 last:border-0"
                    >
                      {renderItem(item)}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {open && query && results.length === 0 && !loading && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-slate-500 text-sm">
                No results for "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ── Main Component ──────────────────────────────────────── */
export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [notes, setNotes] = useState('');

  const [returnCondition, setReturnCondition] = useState('good');
  const [returnFine, setReturnFine] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit, ...(statusFilter && { status: statusFilter }) });
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [statusFilter, pagination.limit]);

  useEffect(() => { fetchTransactions(1); }, [statusFilter]);

  const searchUsers = async (q) => {
    try { const res = await api.get(`/users?search=${encodeURIComponent(q)}&limit=8`); return res.data || []; }
    catch { return []; }
  };

  const searchBooks = async (q) => {
    try { const res = await api.get(`/books?search=${encodeURIComponent(q)}&availability=available&limit=8`); return res.data || []; }
    catch { return []; }
  };

  const resetIssueModal = () => { setSelectedUser(null); setSelectedBook(null); setNotes(''); };
  const resetReturnModal = () => { setSelectedTransaction(null); setReturnCondition('good'); setReturnFine(''); setReturnNotes(''); };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedBook) { toast.error('Please select both a user and a book'); return; }
    setSubmitting(true);
    try {
      await api.post('/transactions/issue', { userId: selectedUser._id, bookId: selectedBook._id, notes });
      toast.success(`"${selectedBook.title}" issued to ${selectedUser.name}!`);
      setShowIssueModal(false); resetIssueModal(); fetchTransactions(1);
    } catch (err) { toast.error(err.message || 'Issue failed'); }
    finally { setSubmitting(false); }
  };

  const handleReturn = async () => {
    if (!selectedTransaction) return;
    setSubmitting(true);
    try {
      const res = await api.post('/transactions/return', { 
        transactionId: selectedTransaction._id,
        condition: returnCondition,
        fineAmount: returnFine || 0,
        notes: returnNotes
      });
      const fine = res.data?.fine;
      if (fine) { toast.success(`Processed. Fine generated: ₹${fine.totalAmount}`, { duration: 5000 }); }
      else { toast.success('Processed successfully!'); }
      setShowReturnModal(false); resetReturnModal(); fetchTransactions(pagination.page);
    } catch (err) { toast.error(err.message || 'Processing failed'); }
    finally { setSubmitting(false); }
  };

  const handleRenew = async (transaction) => {
    try {
      await api.post('/transactions/renew', { transactionId: transaction._id });
      toast.success('Book renewed successfully!');
      fetchTransactions(pagination.page);
    } catch (err) { toast.error(err.message || 'Renewal failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="page-title flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30"
            >
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            </motion.div>
            Book Circulation
          </h1>
          <p className="page-subtitle">Issue, return, and renew books</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => { resetIssueModal(); setShowIssueModal(true); }} variant="success" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Issue Book
          </Button>
        </motion.div>
      </motion.div>

      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="admin-card flex items-center gap-3"
      >
        <label className="text-slate-400 text-sm font-medium">Filter:</label>
        <div className="flex gap-2">
          {['', 'active', 'overdue', 'returned'].map(s => (
            <motion.button
              key={s}
              onClick={() => setStatusFilter(s)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${statusFilter === s
                ? s === 'overdue' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : s === 'returned' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-primary-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-surface-700'}`}
            >
              {s === '' ? 'All' : s}
            </motion.button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500 font-mono">{pagination.total} records</span>
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton rows={10} cols={7} /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card p-0">
          <table className="table">
            <thead>
              <tr>
                <th>User</th><th>Book</th><th>Issued</th><th>Due Date</th><th>Status</th><th>Fine</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No transactions found</td></tr>
              ) : transactions.map((t, i) => {
                const overdue = getDaysOverdue(t.dueDate);
                return (
                  <motion.tr key={t._id} custom={i} variants={rowVariants} initial="hidden" animate="visible">
                    <td>
                      <p className="font-medium text-white">{t.user?.name}</p>
                      <p className="text-xs text-slate-500">{t.user?.studentId || t.user?.email}</p>
                    </td>
                    <td>
                      <p className="font-medium text-white text-sm leading-tight">{t.book?.title?.slice(0, 30)}</p>
                      <p className="text-xs text-slate-500">{t.book?.author}</p>
                    </td>
                    <td className="text-slate-400 text-sm">{formatDate(t.issueDate)}</td>
                    <td>
                      <p className={`text-sm ${overdue > 0 && t.status !== 'returned' ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                        {formatDate(t.dueDate)}
                      </p>
                      {overdue > 0 && t.status !== 'returned' && (
                        <motion.p
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-xs text-red-500 font-bold"
                        >
                          {overdue}d overdue
                        </motion.p>
                      )}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.fine
                        ? <span className={`text-sm font-semibold ${t.fine.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>₹{t.fine.totalAmount}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {t.status !== 'returned' && (
                          <>
                            <motion.button
                              onClick={() => { setSelectedTransaction(t); setShowReturnModal(true); }}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Return Book"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </motion.button>
                            {t.renewalCount < t.maxRenewals && overdue === 0 && (
                              <motion.button
                                onClick={() => handleRenew(t)}
                                whileHover={{ scale: 1.2, rotate: -180 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                                title="Renew"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </motion.button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-surface-700">
            <Pagination {...pagination} onPageChange={fetchTransactions} />
          </div>
        </motion.div>
      )}

      {/* Issue Book Modal */}
      <Modal isOpen={showIssueModal} onClose={() => { setShowIssueModal(false); resetIssueModal(); }} title="Issue Book to User">
        <form onSubmit={handleIssue} className="space-y-5">
          <SearchSelect
            label="Search & Select User"
            placeholder="Type name, email, or student ID..."
            onSearch={searchUsers}
            onSelect={setSelectedUser}
            selected={selectedUser}
            renderItem={(u) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">{u.name?.[0]}</div>
                <div>
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-slate-400 text-xs">{u.email} · <span className="capitalize">{u.role}</span> {u.studentId && `· ${u.studentId}`}</p>
                </div>
              </div>
            )}
            renderSelected={(u) => (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-300 font-semibold text-sm">{u.name}</p>
                  <p className="text-slate-400 text-xs capitalize">{u.role} · {u.email}</p>
                </div>
              </div>
            )}
          />
          <SearchSelect
            label="Search & Select Book (Available Only)"
            placeholder="Type title, author, or ISBN..."
            onSearch={searchBooks}
            onSelect={setSelectedBook}
            selected={selectedBook}
            renderItem={(b) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-13 rounded-lg bg-primary-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {b.coverImage ? <img src={b.coverImage} alt="" className="w-full h-full object-cover rounded-lg" /> : <BookOpen className="w-5 h-5 text-primary-400" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{b.title}</p>
                  <p className="text-slate-400 text-xs">{b.author} · {b.category}</p>
                  <p className="text-emerald-400 text-xs mt-0.5">{b.availableCopies} cop{b.availableCopies === 1 ? 'y' : 'ies'} available</p>
                </div>
              </div>
            )}
            renderSelected={(b) => (
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-300 font-semibold text-sm">{b.title}</p>
                  <p className="text-slate-400 text-xs">{b.author} · {b.availableCopies} available</p>
                </div>
              </div>
            )}
          />

          <AnimatePresence>
            {selectedUser && selectedBook && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 space-y-1 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-primary-300 text-sm font-semibold mb-2">
                  <CheckCircle className="w-4 h-4" /> Ready to Issue
                </div>
                <p className="text-slate-300 text-sm">📖 <span className="text-white font-medium">{selectedBook.title}</span></p>
                <p className="text-slate-300 text-sm">👤 <span className="text-white font-medium">{selectedUser.name}</span> ({selectedUser.role})</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field h-20 resize-none" placeholder="Any special notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={() => { setShowIssueModal(false); resetIssueModal(); }}>Cancel</Button>
            <Button type="submit" variant="success" isLoading={submitting} disabled={!selectedUser || !selectedBook}>✓ Issue Book</Button>
          </div>
        </form>
      </Modal>

      {/* Return Confirm Modal */}
      <Modal isOpen={showReturnModal} onClose={() => { setShowReturnModal(false); resetReturnModal(); }} title="Process Asset Return" size="md">
        {selectedTransaction && (
          <form onSubmit={(e) => { e.preventDefault(); handleReturn(); }} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="admin-card"
              style={{ background: 'rgba(30,41,59,0.7)' }}
            >
              <p className="text-white font-semibold">{selectedTransaction.book?.title}</p>
              <p className="text-slate-400 text-sm mt-1">Borrower: <span className="text-slate-300">{selectedTransaction.user?.name}</span></p>
              <p className="text-slate-500 text-xs mt-1">Due: {formatDate(selectedTransaction.dueDate)}</p>
              {getDaysOverdue(selectedTransaction.dueDate) > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{getDaysOverdue(selectedTransaction.dueDate)} days overdue — automatic late fine pending.</span>
                </motion.div>
              )}
            </motion.div>

            <div className="space-y-4 pt-1">
               <div>
                 <label className="label">Asset condition upon return</label>
                 <select value={returnCondition} onChange={e => setReturnCondition(e.target.value)} className="input-field">
                   <option value="good">Good (Normal Return)</option>
                   <option value="damaged">Damaged</option>
                   <option value="lost">Lost Asset</option>
                 </select>
               </div>

               <AnimatePresence>
                 {returnCondition !== 'good' && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                     <div className="pt-2">
                       <label className="label">Manual Penalty / Replacement Fee (₹)</label>
                       <input type="number" min="0" value={returnFine} onChange={e => setReturnFine(e.target.value)} placeholder="Amount to charge..." className="input-field" required={returnCondition === 'lost'} />
                       <p className="text-xs text-slate-500 mt-1">This penalty is appended to any automatic overdue fines.</p>
                     </div>
                     <div>
                       <label className="label">Notes / Description of issue</label>
                       <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} className="input-field h-20 resize-none" placeholder="Explain the damage or loss circumstance..." required />
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50 mt-4">
              <Button type="button" variant="secondary" onClick={() => { setShowReturnModal(false); resetReturnModal(); }}>Cancel</Button>
              <Button type="submit" variant="success" isLoading={submitting}>Process Transaction</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
