import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Package, ShoppingCart, Users, AlertTriangle, RefreshCw, Printer, BarChart3, TrendingDown, Crown } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ScrollReveal, AnimatedCounter } from '../../components/ui/FloatingElements';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'overdue',   label: 'Overdue Summary',    icon: AlertTriangle, color: 'text-red-400',     bg: 'from-red-600 to-rose-600' },
  { key: 'stock',     label: 'Inventory Report',   icon: Package,       color: 'text-blue-400',    bg: 'from-blue-600 to-cyan-600' },
  { key: 'purchases', label: 'Financial Statement', icon: ShoppingCart, color: 'text-violet-400',  bg: 'from-violet-600 to-purple-600' },
  { key: 'members',   label: 'Membership Report',  icon: Users,         color: 'text-emerald-400', bg: 'from-emerald-600 to-teal-600' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.35 },
  }),
};

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('overdue');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchReport = async (tab) => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/reports/${tab}`);
      setData(prev => ({ ...prev, [tab]: res.data }));
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!data[activeTab]) fetchReport(activeTab);
  }, [activeTab]);

  const handlePrint = () => { window.print(); };
  const d = data[activeTab];

  const SummaryCard = ({ label, value, color = 'text-white', icon: Icon, index = 0 }) => (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
      className="admin-card border-l-4 border-surface-600 shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
        {Icon && <Icon className="w-10 h-10" />}
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black mt-2 ${color}`}>{value}</p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between no-print"
      >
        <div>
          <h1 className="page-title flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center border border-primary-500/30"
            >
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </motion.div>
            Executive Analytics
          </h1>
          <p className="page-subtitle italic">Deep-dive repository performance & financial logs</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={handlePrint}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </motion.button>
          <motion.button
            onClick={() => fetchReport(activeTab)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap no-print"
      >
        {TABS.map(({ key, label, icon: Icon, color, bg }) => (
          <motion.button
            key={key}
            onClick={() => setActiveTab(key)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${activeTab === key
              ? `bg-gradient-to-r ${bg} text-white shadow-lg`
              : 'bg-surface-800 text-slate-400 border border-surface-700 hover:border-slate-500'}`}
          >
            <Icon className={`w-4 h-4 ${activeTab === key ? 'text-white' : color}`} />
            {label}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <div className="printable-content" id="printable-report">
        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b-2 border-black pb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-black">EBMS LIBRARY SYSTEMS</h1>
              <p className="text-slate-600 font-medium">Headquarters Operational Intelligence Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-black uppercase">{activeTab.replace('_', ' ')} Report</p>
              <p className="text-xs text-slate-500">Generated: {formatDate(new Date())}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </motion.div>
          ) : !d ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20 text-slate-500">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Initializing operational data...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* ── OVERDUE REPORT ── */}
              {activeTab === 'overdue' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <SummaryCard label="Delinquent Assets" value={d.summary?.totalOverdue ?? 0} color="text-red-500" icon={AlertTriangle} index={0} />
                    <SummaryCard label="Average Delay" value={`${d.summary?.avgDaysOverdue ?? 0} days`} color="text-amber-500" icon={TrendingDown} index={1} />
                    <SummaryCard label="Outstanding Fines" value={formatCurrency(d.summary?.totalFinesDue ?? 0)} color="text-orange-500" icon={ShoppingCart} index={2} />
                  </div>
                  {d.list?.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card text-center py-16 border-2 border-dashed border-surface-700 text-slate-500">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      All assets returned in scheduled windows.
                    </motion.div>
                  ) : (
                    <div className="admin-card p-0 overflow-hidden">
                      <table className="table print:text-black">
                        <thead className="print:bg-slate-100 print:text-black font-bold">
                          <tr><th>Identity</th><th>Asset</th><th>Copy</th><th>Scheduled Return</th><th>Overdue</th><th>Fine</th></tr>
                        </thead>
                        <tbody>
                          {d.list?.map((t, i) => (
                            <motion.tr key={t._id} custom={i} variants={rowVariants} initial="hidden" animate="visible" className="print:border-b border-slate-200">
                              <td>
                                <p className="font-bold print:text-black">{t.user?.name}</p>
                                <p className="text-xs text-slate-500">{t.user?.studentId || t.user?.email}</p>
                              </td>
                              <td>
                                <p className="font-bold print:text-black">{t.book?.title}</p>
                                <p className="text-xs italic text-slate-500">{t.book?.author}</p>
                              </td>
                              <td className="font-mono text-xs text-primary-400 print:text-slate-600">{t.bookCopy?.copyNumber}</td>
                              <td className="font-medium">{formatDate(t.dueDate)}</td>
                              <td>
                                <motion.span animate={t.daysOverdue > 10 ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} className="badge-danger font-black">
                                  {t.daysOverdue} Days
                                </motion.span>
                              </td>
                              <td className="font-black text-white print:text-black">{t.fine ? formatCurrency(t.fine.totalAmount) : '₹0.00'}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── STOCK REPORT ── */}
              {activeTab === 'stock' && (
                <div className="space-y-6">
                  <SummaryCard label="Global Inventory Holdings" value={d.summary?.totalCopies ?? 0} color="text-blue-400" icon={Package} index={0} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="admin-card border-t-4 border-blue-500">
                      <h3 className="text-white font-bold text-lg mb-6 tracking-tight uppercase">Copy Status Distribution</h3>
                      <div className="space-y-3">
                        {d.byStatus?.map((s, i) => (
                          <motion.div key={s.status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between py-3 border-b border-surface-700/50 last:border-0 hover:bg-surface-700/20 px-2 rounded-lg transition-colors">
                            <StatusBadge status={s.status} />
                            <span className="font-black text-white text-lg">{s.count}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                    <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="admin-card border-t-4 border-emerald-500">
                      <h3 className="text-white font-bold text-lg mb-6 tracking-tight uppercase">Physical Lifecycle State</h3>
                      <div className="space-y-3">
                        {d.byCondition?.map((c, i) => (
                          <motion.div key={c.condition} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between py-3 border-b border-surface-700/50 last:border-0 hover:bg-surface-700/20 px-2 rounded-lg transition-colors">
                            <span className="text-slate-300 font-bold capitalize">{c.condition}</span>
                            <span className="font-black text-white text-lg">{c.count}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                  <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="admin-card p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-700">
                      <h3 className="text-white font-bold text-lg tracking-tight uppercase">Category Utilization Matrix</h3>
                    </div>
                    <table className="table">
                      <thead><tr><th>Category</th><th>Total</th><th>On Shelf</th><th>In Circulation</th></tr></thead>
                      <tbody>
                        {d.byCategory?.map((c, i) => (
                          <motion.tr key={c.category} custom={i} variants={rowVariants} initial="hidden" animate="visible">
                            <td className="font-black text-white">{c.category}</td>
                            <td className="font-medium text-slate-400">{c.totalCopies}</td>
                            <td className="text-emerald-400 font-bold">{c.availableCopies}</td>
                            <td className="text-amber-400 font-bold">{c.totalCopies - c.availableCopies}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                </div>
              )}

              {/* ── PURCHASE REPORT ── */}
              {activeTab === 'purchases' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <SummaryCard label="Total Capital Expenditure" value={formatCurrency(d.summary?.totalSpend ?? 0)} color="text-violet-400" icon={ShoppingCart} index={0} />
                    <SummaryCard label="Invoices Cleared" value={d.summary?.invoiceCount ?? 0} color="text-white" icon={FileText} index={1} />
                    <SummaryCard label="Direct POs" value={d.summary?.poCount ?? 0} color="text-white" icon={Package} index={2} />
                  </div>
                  <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="admin-card overflow-hidden">
                    <h3 className="text-white font-bold text-lg mb-6 tracking-tight uppercase">Supplier Portfolio Concentration</h3>
                    <div className="space-y-5">
                      {d.spendBySupplier?.map((s, i) => {
                        const pct = d.summary?.totalSpend ? Math.round((s.totalSpend / d.summary.totalSpend) * 100) : 0;
                        return (
                          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }} className="group">
                            <div className="flex justify-between mb-2 items-center">
                              <span className="text-slate-200 font-bold group-hover:text-violet-400 transition-colors uppercase text-sm tracking-wide">
                                {s.name || 'Unknown'}
                                <span className="text-slate-600 text-[10px] ml-2 tracking-normal">ID: {s.code || 'SYS-UID'}</span>
                              </span>
                              <span className="text-white font-black">{formatCurrency(s.totalSpend)}</span>
                            </div>
                            <div className="h-3 bg-surface-900 rounded-full overflow-hidden border border-surface-700">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="admin-card border-l-4 border-primary-500">
                      <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Recent Acquisitions</h4>
                      <div className="space-y-3">
                        {d.recentPOs?.slice(0, 5).map((po, i) => (
                          <motion.div key={po._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-3 bg-surface-700/30 rounded-xl hover:bg-surface-700 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-white uppercase">{po.poNumber}</p>
                              <p className="text-xs text-slate-500">{formatDate(po.orderDate)}</p>
                            </div>
                            <span className="text-sm font-black text-emerald-400">{formatCurrency(po.totalAmount)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                    <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="admin-card border-l-4 border-amber-500">
                      <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Billing Operations</h4>
                      <div className="space-y-3">
                        {d.recentInvoices?.slice(0, 5).map((inv, i) => (
                          <motion.div key={inv._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-3 bg-surface-700/30 rounded-xl hover:bg-surface-700 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-white uppercase">{inv.invoiceNumber}</p>
                              <p className="text-xs text-slate-500">{formatDate(inv.invoiceDate)}</p>
                            </div>
                            <span className="text-sm font-black text-amber-400">{formatCurrency(inv.totalAmount)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* ── MEMBER REPORT ── */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {d.roleBreakdown?.map((r, i) => (
                      <motion.div
                        key={r.role}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
                        className="admin-card border-b-4 border-emerald-500 text-center"
                      >
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">{r.role}</p>
                        <p className="text-3xl font-black text-white">{r.count}</p>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-3 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold"
                        >
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {r.active} ACTIVE
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="admin-card shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Users className="w-40 h-40" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-6 tracking-tight uppercase flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" /> Key Engagement Leaders
                    </h3>
                    <div className="admin-card p-0 overflow-hidden">
                      <table className="table">
                        <thead><tr><th>Identity</th><th>Role</th><th>System UID</th><th>Activity Volume</th></tr></thead>
                        <tbody>
                          {d.topBorrowers?.map((u, i) => (
                            <motion.tr key={i} custom={i} variants={rowVariants} initial="hidden" animate="visible">
                              <td>
                                <div className="flex items-center gap-3">
                                  <motion.div whileHover={{ scale: 1.15 }} className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center font-bold text-xs text-white">
                                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                                  </motion.div>
                                  <div className="min-w-0">
                                    <p className="font-black text-white truncate">{u.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="capitalize font-medium">{u.role}</td>
                              <td className="font-mono text-xs text-primary-400">{u.studentId || 'N/A'}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-surface-800 rounded-full max-w-[100px]">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(100, (u.borrowCount / 5) * 100)}%` }}
                                      transition={{ duration: 1, delay: i * 0.1 }}
                                      className="h-full bg-primary-500 rounded-full"
                                    />
                                  </div>
                                  <span className="font-black whitespace-nowrap">{u.borrowCount} issues</span>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; font-family: 'Inter', sans-serif !important; }
          .no-print { display: none !important; }
          #app-sidebar, #app-navbar { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 0 !important; }
          .printable-content { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .admin-card { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; color: black !important; padding: 15px !important; margin-bottom: 20px !important; }
          .table-wrapper { box-shadow: none !important; overflow: visible !important; }
          .table { border-collapse: collapse !important; border: 1px solid #ddd !important; width: 100% !important; }
          .table th { background: #f3f4f6 !important; color: black !important; border: 1px solid #ddd !important; padding: 10px !important; text-transform: uppercase; font-size: 10px; }
          .table td { border: 1px solid #ddd !important; color: black !important; padding: 10px !important; font-size: 11px; }
          .text-white, .text-slate-300, .text-primary-400 { color: black !important; }
          .text-slate-500, .text-slate-600 { color: #666 !important; }
          .bg-surface-700, .bg-surface-800, .bg-surface-900 { background: white !important; }
          .badge-danger { border: 1px solid red !important; color: red !important; background: transparent !important; padding: 2px 6px !important; font-weight: bold !important; }
          .badge-info, .badge-purple { border: 1px solid blue !important; color: blue !important; background: transparent !important; }
          @page { size: portrait; margin: 15mm; }
          .hidden.print\\:block { display: block !important; }
        }
      `}} />
    </div>
  );
}
