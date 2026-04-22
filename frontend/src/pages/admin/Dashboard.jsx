import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, AlertTriangle, DollarSign,
  TrendingUp, BookMarked, RefreshCw, Clock,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { SparklesCore } from '../../components/ui/sparkles';
import { BentoGrid, BentoGridItem } from '../../components/ui/bento-grid';
import { Highlight } from '../../components/ui/hero-highlight';
import { CardSpotlight } from '../../components/ui/card-spotlight';
import { TiltCard } from '../../components/ui/TiltCard';
import { ScrollReveal, AnimatedCounter } from '../../components/ui/FloatingElements';
import { FloatingShapes } from '../../components/ui/FloatingElements';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [issueTrends, setIssueTrends] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, issueRes, revenueRes, catRes, popRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/issue-trends?days=30'),
          api.get('/analytics/revenue-trends?months=6'),
          api.get('/analytics/category-distribution'),
          api.get('/analytics/popular-books?limit=5'),
        ]);
        setStats(statsRes.data);
        setIssueTrends(issueRes.data);
        setRevenueTrends(revenueRes.data);
        setCategoryData(catRes.data);
        setPopularBooks(popRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Header with Sparkles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="h-[25rem] w-full bg-surface-950 flex flex-col items-center justify-center overflow-hidden rounded-[3rem] relative border border-surface-800 shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-0 w-full h-full bg-surface-950 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
        <FloatingShapes className="z-10 opacity-60" />
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full absolute inset-0"
          particleColor="#6366f1"
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="relative z-20 text-center px-4"
        >
          <h1 className="md:text-6xl text-4xl lg:text-7xl font-bold text-center text-white mb-4 tracking-tighter">
            System <Highlight className="text-white">Overview</Highlight>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-lg">
            Monitor library operations, circulation, and user activity in real-time.
          </p>
        </motion.div>
      </motion.div>

      {/* KPI Cards with 3D Tilt */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {[
          {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            sub: `${stats?.newUsersThisMonth || 0} new this month`,
            color: 'blue',
            icon: Users,
            gradient: 'from-blue-500/20 to-blue-600/5',
            glow: 'rgba(59, 130, 246, 0.15)',
          },
          {
            title: 'Books Issued',
            value: stats?.issuedBooks || 0,
            sub: `${stats?.totalBooks || 0} total fleet`,
            color: 'violet',
            icon: BookOpen,
            gradient: 'from-violet-500/20 to-violet-600/5',
            glow: 'rgba(139, 92, 246, 0.15)',
          },
          {
            title: 'Overdue',
            value: stats?.overdueBooks || 0,
            sub: 'Attention required',
            color: 'red',
            icon: AlertTriangle,
            gradient: 'from-red-500/20 to-red-600/5',
            glow: 'rgba(239, 68, 68, 0.15)',
          },
          {
            title: 'Revenue',
            value: null,
            displayValue: formatCurrency(stats?.fineRevenue),
            sub: 'Total fines collected',
            color: 'emerald',
            icon: DollarSign,
            gradient: 'from-emerald-500/20 to-emerald-600/5',
            glow: 'rgba(16, 185, 129, 0.15)',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            style={{ perspective: '1200px' }}
          >
            <TiltCard
              glareColor={kpi.glow}
              maxTilt={10}
              className="h-full"
            >
              <div className={`admin-card h-full bg-gradient-to-br ${kpi.gradient} border-surface-800`}>
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className={`w-12 h-12 rounded-2xl bg-${kpi.color}-500/20 flex items-center justify-center border border-${kpi.color}-500/30`}
                  >
                    <kpi.icon className={`w-6 h-6 text-${kpi.color}-400`} />
                  </motion.div>
                </div>
                <p className={`text-3xl font-black text-${kpi.color}-400 tracking-tight mb-1`}>
                  {kpi.displayValue || (
                    <AnimatedCounter value={kpi.value} className={`text-${kpi.color}-400`} />
                  )}
                </p>
                <p className="text-sm font-semibold text-slate-200">{kpi.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* Complex Charts Section */}
      <ScrollReveal className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <CardSpotlight className="h-full">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </motion.div>
            Circulation Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={issueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(d) => d.slice(5)} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="basis" dataKey="issued" stroke="#6366f1" strokeWidth={3} dot={false} name="Issued" />
              <Line type="basis" dataKey="returned" stroke="#10b981" strokeWidth={3} dot={false} name="Returned" />
            </LineChart>
          </ResponsiveContainer>
        </CardSpotlight>

        <CardSpotlight className="h-full" color="#10b98115">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 tracking-tight">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Fiscal Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} cursor={{fill: '#1e293b'}} formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardSpotlight>
      </ScrollReveal>

      {/* Category Deep Dive */}
      <ScrollReveal delay={0.1} className="max-w-7xl mx-auto">
        <div className="admin-card bg-surface-900 border border-surface-800 min-h-[500px]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 border-b border-surface-800 pb-4 tracking-tight">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <BookMarked className="w-6 h-6 text-violet-400" />
            </motion.div>
            Category Distribution
          </h3>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2 relative">
              <div className="absolute inset-0 bg-violet-500/10 blur-[100px] rounded-full animate-morphBlob1" />
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={100} outerRadius={150} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {categoryData.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.03, x: 4 }}
                  className="flex items-center gap-4 bg-surface-950 p-4 rounded-2xl border border-surface-800 hover:border-surface-700 transition-all duration-300 cursor-default"
                >
                  <div className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ background: COLORS[index % COLORS.length] }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{item.name}</span>
                    <span className="text-xs text-slate-500 font-medium">{item.value} books</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
