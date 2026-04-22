import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, Crown, BarChart3, Layers } from 'lucide-react';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { CardSpotlight } from '../../components/ui/card-spotlight';
import { ScrollReveal, AnimatedCounter } from '../../components/ui/FloatingElements';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function AdminAnalytics() {
  const [issueTrends, setIssueTrends] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [issueRes, revenueRes, catRes, popRes] = await Promise.all([
          api.get(`/analytics/issue-trends?days=${days}`),
          api.get('/analytics/revenue-trends?months=12'),
          api.get('/analytics/category-distribution'),
          api.get('/analytics/popular-books?limit=10'),
        ]);
        setIssueTrends(issueRes.data);
        setRevenueTrends(revenueRes.data);
        setCategoryData(catRes.data);
        setPopularBooks(popRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, [days]);

  if (loading) return <PageLoader />;

  const tooltipStyle = {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: '#f1f5f9',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  };

  return (
    <div className="space-y-8">
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
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center border border-primary-500/30"
            >
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </motion.div>
            Analytics & Reports
          </h1>
          <p className="page-subtitle">Detailed library usage metrics</p>
        </div>
        <motion.select
          value={days}
          onChange={e => setDays(e.target.value)}
          whileHover={{ scale: 1.02 }}
          className="input-field w-40"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </motion.select>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Issue Trends */}
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <CardSpotlight className="h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                <TrendingUp className="w-5 h-5 text-primary-400" />
              </motion.div>
              Issue Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={issueTrends}>
                <defs>
                  <linearGradient id="issued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="returned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Area type="monotone" dataKey="issued" stroke="#6366f1" fill="url(#issued)" strokeWidth={2.5} name="Issued" />
                <Area type="monotone" dataKey="returned" stroke="#10b981" fill="url(#returned)" strokeWidth={2.5} name="Returned" />
              </AreaChart>
            </ResponsiveContainer>
          </CardSpotlight>
        </motion.div>

        {/* Revenue */}
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <CardSpotlight className="h-full" color="#10b98115">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
              <Layers className="w-5 h-5 text-emerald-400" />
              Revenue Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} formatter={v => [`₹${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardSpotlight>
        </motion.div>

        {/* Category Distribution */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <CardSpotlight className="h-full" color="#8b5cf615">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>📚</motion.span>
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4} dataKey="value" stroke="none"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardSpotlight>
        </motion.div>

        {/* Top Books */}
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <CardSpotlight className="h-full" color="#f59e0b15">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
              <Crown className="w-5 h-5 text-amber-400" />
              Top Issued Books
            </h3>
            <div className="space-y-3">
              {popularBooks.slice(0, 8).map((book, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 group"
                >
                  <motion.span
                    whileHover={{ scale: 1.2 }}
                    className={`text-lg font-black w-8 text-center ${i < 3 ? 'text-amber-400' : 'text-surface-600'}`}
                  >
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-primary-300 transition-colors">{book.title}</p>
                    <div className="mt-1.5 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (book.count / (popularBooks[0]?.count || 1)) * 100)}%` }}
                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-primary-600 to-violet-500 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right font-mono font-bold">{book.count} issues</span>
                </motion.div>
              ))}
            </div>
          </CardSpotlight>
        </motion.div>
      </div>
    </div>
  );
}
